// 一覧の組み立ての純関数(obsidian を import しない)。対象のパスか・日数・古い順の並び・末尾のまとまりへの振り分け。
// 1本の解析が例外で落ちても、そのメモを「読めなかったメモ」に回して他は出す(FR-15・INV-7)。
import { parseMemo, type MemoError, type MemoInput, type MemoSummary, type Rules, type Section, type Updated } from "./parse";
import { S } from "./strings";

export type MemoResult = MemoSummary | MemoError;

export interface Board {
	dated: MemoSummary[];       // 古い順(FR-4・D-14)
	unknown: MemoSummary[];     // 最終更新 不明・読めない
	notStarted: MemoSummary[];  // FR-17
	failed: MemoError[];        // FR-15
	total: number;
}

/** メモフォルダの直下にある拡張子 md のファイルか(FR-1・INV-2)。folder は normalizePath 済みの物 */
export function isMemoPath(path: string, folder: string): boolean {
	if (!path.endsWith(".md")) return false;
	const i = path.lastIndexOf("/");
	const dir = i < 0 ? "" : path.slice(0, i);
	return dir.normalize("NFC") === (folder === "/" ? "" : folder).normalize("NFC");
}

/** 端末のローカル日付から最終更新の日付を引いた日数。時刻は使わない(FR-3)。負なら未来 */
export function daysSince(u: Updated, now: Date): number {
	const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.round((today - Date.UTC(u.y, u.m - 1, u.d)) / 86_400_000);
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");

/** 本文の日付と時刻のまま(§9.4) */
export function updatedText(u: MemoSummary["updated"]): string {
	if (u === "missing") return S.updatedMissing;
	if (u === "unreadable") return S.updatedUnreadable;
	return `${pad(u.y, 4)}-${pad(u.m, 2)}-${pad(u.d, 2)}` + (u.hhmm ? ` ${u.hhmm}` : "");
}

function sortKey(u: MemoSummary["updated"]): string {
	return typeof u === "string" ? "~" : `${pad(u.y, 4)}-${pad(u.m, 2)}-${pad(u.d, 2)} ${u.hhmm ?? "00:00"}`;
}

// localeCompare は端末の言語設定で変わりうるので使わない(D-14)
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function parseSafe(input: MemoInput, rules: Rules): MemoResult {
	try {
		return parseMemo(input, rules);
	} catch (e) {
		return { path: input.path, name: input.name, error: e instanceof Error ? e.message : String(e) };
	}
}

export function buildBoard(results: Iterable<MemoResult>): Board {
	const board: Board = { dated: [], unknown: [], notStarted: [], failed: [], total: 0 };
	const memos: MemoSummary[] = [];
	for (const r of results) {
		board.total++;
		if ("error" in r) board.failed.push(r);
		else memos.push(r);
	}
	memos.sort((a, b) => cmp(sortKey(a.updated), sortKey(b.updated)) || cmp(a.path, b.path));
	for (const m of memos) {
		if (m.notStarted) board.notStarted.push(m);
		else if (typeof m.updated === "string") board.unknown.push(m);
		else board.dated.push(m);
	}
	board.failed.sort((a, b) => cmp(a.path, b.path));
	return board;
}

/** 先頭 count 件。chars を超えた分は切り … を付ける。字数はコードポイント(FR-7) */
export function previewLines(sec: Section | null, count: number, chars: number): string[] {
	if (!sec) return [];
	return sec.items.slice(0, count).map((t) => {
		const cps = Array.from(t);
		return cps.length > chars ? cps.slice(0, chars).join("") + "…" : t;
	});
}

/** FR-18 の注記: 一覧の1つ目の名前でないかレベル2でなければ実際の見出し行、同名の節の数、表 */
export function sectionNotes(sec: Section | null, names: readonly string[]): string[] {
	if (!sec) return [];
	const first = names.map((n) => n.trim().normalize("NFC")).find((n) => n !== "");
	const notes: string[] = [];
	if (sec.heading !== first || sec.level !== 2) notes.push(`${"#".repeat(sec.level)} ${sec.heading}`);
	if (sec.sameName >= 2) notes.push(S.sameName(sec.sameName));
	if (sec.hasTable) notes.push(S.tableNotCounted);
	return notes;
}
