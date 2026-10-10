// メモ1本の本文を MemoSummary にする純関数(obsidian を import しない。D-4・D-11)。
// 見出しと項目はコードブロックの外だけを見る。件数は行の形だけで決め、項目の文言は見ない(FR-5・FR-6・INV-8)。
// 日付は数として読み、Date の文字列解析を使わない(D-21)。
import type { Settings } from "./settings";

export type Rules = Pick<Settings,
	"nextHeadings" | "openHeadings" | "updatedPrefix" | "statusPrefix" | "notStartedValue" | "appendMarkerPrefix">;

export interface Section {
	heading: string;     // 見出しの文字(# を除き前後の空白を除いた NFC)
	level: number;       // 1〜6
	line: number;        // 見出しの行(0 始まり)
	items: string[];     // FR-6 の項目の行から先頭の記号を除いた原文(全件)
	appended: number;    // FR-16 のマーカー行の数
	hasTable: boolean;   // 行頭が | の行があるか
	sameName: number;    // 一覧に当たった見出しの数
}
export interface Updated { y: number; m: number; d: number; hhmm: string | null }
export interface MemoSummary {
	path: string;
	name: string;
	updated: Updated | "missing" | "unreadable";
	notStarted: boolean;
	next: Section | null;    // null = 節なし
	open: Section | null;
}
export interface MemoError { path: string; name: string; error: string }
export interface MemoInput { path: string; name: string; text: string }
export interface Heading { level: number; text: string; line: number }

const HEADING = /^(#{1,6}) (.*)$/;
const ITEM = /^(?:- |\d+\. )/;
const FENCE_OPEN = /^\s*(`{3,}|~{3,})/;
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/;
const DATE = /^ +(\d{4})-(\d{2})-(\d{2})(?: +(\d{2}):(\d{2}))?(?!\d)/;

/** 先頭の BOM と行末の \r を除き、NFC にして行に分ける(§10) */
export function splitLines(text: string): string[] {
	const t = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
	return t.normalize("NFC").split("\n").map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

/** 行ごとの「コードブロックの中か」と、ブロックの外の見出し(FR-5) */
export function scanHeadings(lines: readonly string[]): { inCode: boolean[]; headings: Heading[] } {
	const inCode: boolean[] = [];
	const headings: Heading[] = [];
	let fence: string | null = null;
	lines.forEach((l, i) => {
		if (fence !== null) {
			inCode.push(true);
			const c = FENCE_CLOSE.exec(l)?.[1];
			if (c !== undefined && c[0] === fence[0] && c.length >= fence.length) fence = null;
			return;
		}
		const o = FENCE_OPEN.exec(l)?.[1];
		if (o !== undefined) {
			fence = o;
			inCode.push(true);
			return;
		}
		inCode.push(false);
		const h = HEADING.exec(l);
		if (h) headings.push({ level: (h[1] ?? "").length, text: (h[2] ?? "").trim(), line: i });
	});
	return { inCode, headings };
}

function daysInMonth(y: number, m: number): number {
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function readUpdated(head: readonly string[], prefix: string): MemoSummary["updated"] {
	if (prefix === "") return "missing";
	const line = head.find((l) => l.startsWith(prefix));
	if (line === undefined) return "missing";
	const m = DATE.exec(line.slice(prefix.length));
	if (!m) return "unreadable";
	const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
	if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return "unreadable";
	const hh = m[4], mm = m[5];
	const hhmm = hh !== undefined && mm !== undefined && Number(hh) <= 23 && Number(mm) <= 59 ? `${hh}:${mm}` : null;
	return { y, m: mo, d, hhmm };
}

function findSection(lines: readonly string[], inCode: readonly boolean[], heads: readonly Heading[],
	names: readonly string[], markerPrefix: string): Section | null {
	const wanted = names.map((n) => n.trim().normalize("NFC")).filter((n) => n !== "");
	const hits = heads.filter((h) => wanted.includes(h.text));
	const h = hits[0];
	if (!h) return null;
	const end = heads.find((x) => x.line > h.line && x.level <= h.level)?.line ?? lines.length;
	const items: string[] = [];
	let appended = 0;
	let hasTable = false;
	for (let i = h.line + 1; i < end; i++) {
		const l = lines[i] ?? "";
		if (inCode[i]) continue;
		const it = ITEM.exec(l);
		if (it) items.push(l.slice(it[0].length));
		else if (markerPrefix !== "" && l.startsWith(markerPrefix)) appended++;
		else if (l.startsWith("|")) hasTable = true;
	}
	return { heading: h.text, level: h.level, line: h.line, items, appended, hasTable, sameName: hits.length };
}

/** 本文 → MemoSummary。本文が文字列でなければ例外(呼び手が FR-15 に回す) */
export function parseMemo(input: MemoInput, rules: Rules): MemoSummary {
	const lines = splitLines(input.text);
	const { inCode, headings } = scanHeadings(lines);
	const firstH2 = headings.find((h) => h.level === 2)?.line ?? lines.length;
	const head = lines.slice(0, firstH2).filter((_, i) => !inCode[i]);
	const sp = rules.statusPrefix, nv = rules.notStartedValue.trim();
	const notStarted = sp !== "" && nv !== "" && head.some((l) => l.startsWith(sp) && l.slice(sp.length).trim() === nv);
	const marker = rules.appendMarkerPrefix;
	return {
		path: input.path,
		name: input.name,
		updated: readUpdated(head, rules.updatedPrefix),
		notStarted,
		next: findSection(lines, inCode, headings, rules.nextHeadings, marker),
		open: findSection(lines, inCode, headings, rules.openHeadings, marker),
	};
}
