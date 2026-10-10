// board.ts の純関数(日数・古い順の並び・末尾のまとまり・先頭の項目・注記・読めなかったメモ)。合成の本文だけ(D-21)。
import { describe, expect, it } from "vitest";
import { buildBoard, daysSince, parseSafe, previewLines, sectionNotes, updatedText } from "../src/board";
import { parseMemo, type MemoInput } from "../src/parse";
import { DEFAULTS } from "../src/settings";

const input = (name: string, lines: string[]): MemoInput => ({ path: `引き続きメモ/${name}.md`, name, text: lines.join("\n") });
const dated = (name: string, updated: string, next: string[] = ["- a"]) =>
	input(name, [`# ${name}`, "", `最終更新: ${updated}`, "", "## 次にやること", ...next]);

// 端末のローカル日付で数える(FR-3)。テストもローカルの Date で作る
const at = (y: number, m: number, d: number, hh = 12) => new Date(y, m - 1, d, hh, 0, 0);

describe("日数(FR-3)", () => {
	it("§8.3 の 2026-09-26 時点の日数", () => {
		const now = at(2026, 9, 26);
		expect(daysSince({ y: 2026, m: 8, d: 20, hhmm: "19:34" }, now)).toBe(37);
		expect(daysSince({ y: 2026, m: 9, d: 21, hhmm: null }, now)).toBe(5);
		expect(daysSince({ y: 2026, m: 9, d: 26, hhmm: null }, at(2026, 9, 26, 0))).toBe(0);
		expect(daysSince({ y: 2026, m: 9, d: 27, hhmm: null }, now)).toBe(-1);
	});
	it("時刻は日数に使わない(23:59 でも 0:00 でも同じ)", () => {
		const u = { y: 2026, m: 9, d: 25, hhmm: "23:59" };
		expect(daysSince(u, at(2026, 9, 26, 0))).toBe(1);
		expect(daysSince(u, at(2026, 9, 26, 23))).toBe(1);
	});
});

describe("古い順の並び(FR-4・D-14)", () => {
	it("11 本の並び(名前は作り物。同じ日付は時刻の順、時刻も同じならパスの順)", () => {
		const memos = [
			dated("NoteDesk", "2026-09-21"),
			dated("読書記録アプリ", "2026-09-19 23:40"),
			dated("資料まとめ(12本)_引き継ぎメモ", "2026-09-10"),
			dated("Sample Bot管理ソフト", "2026-09-03"),
			dated("家計簿アプリ", "2026-08-29"),
			dated("DEMO APP", "2026-08-28 01:10"),
			dated("レシピ検索サイト", "2026-08-21 12:24"),
			dated("Editor設定(並び替えの決まり)", "2026-08-21 11:23"),
			dated("さんぽ記録アプリ", "2026-08-21"),
			dated("ABCプレイヤー", "2026-08-21"),
			dated("写真整理ツール", "2026-08-20 19:34"),
		].map((x) => parseSafe(x, DEFAULTS));
		const b = buildBoard(memos);
		expect(b.dated.map((m) => m.name)).toEqual([
			"写真整理ツール", "ABCプレイヤー", "さんぽ記録アプリ", "Editor設定(並び替えの決まり)",
			"レシピ検索サイト", "DEMO APP", "家計簿アプリ", "Sample Bot管理ソフト",
			"資料まとめ(12本)_引き継ぎメモ", "読書記録アプリ", "NoteDesk",
		]);
		expect(b.total).toBe(11);
	});
	it("不明・読めない・未着手・読めなかったは末尾のまとまりへ", () => {
		const stub = input("雛形", ["# 雛形", "状態: 未着手", "## 次にやること", ""]);
		const results = [
			dated("b", "2026-02-30"),
			input("a", ["# a", "## 次にやること"]),
			dated("c", "2026-09-01"),
			stub,
		].map((x) => parseSafe(x, DEFAULTS));
		const b = buildBoard(results);
		expect(b.dated.map((m) => m.name)).toEqual(["c"]);
		expect(b.unknown.map((m) => [m.name, m.updated])).toEqual([["a", "missing"], ["b", "unreadable"]]);
		expect(b.notStarted.map((m) => m.name)).toEqual(["雛形"]);
		expect(b.notStarted[0]?.next?.items.length).toBe(0);
	});
	it("例外を投げる本文が1つあっても残りは出る(AC-17・INV-7)", () => {
		const bad = { path: "引き続きメモ/壊れ.md", name: "壊れ", text: null as unknown as string };
		const results = [dated("x", "2026-09-01"), bad, dated("y", "2026-09-02")].map((i) => parseSafe(i, DEFAULTS));
		const b = buildBoard(results);
		expect(b.dated.map((m) => m.name)).toEqual(["x", "y"]);
		expect(b.failed).toHaveLength(1);
		expect(b.failed[0]?.name).toBe("壊れ");
		expect(b.failed[0]?.error.length).toBeGreaterThan(0);
		expect(b.total).toBe(3);
	});
});

describe("先頭の項目(FR-7)", () => {
	const m = parseMemo(dated("Sample", "2026-09-03", ["1. alpha / alpha2 の値を本物にするか消す", "2. 二", "3. 三", "4. 四"]), DEFAULTS);
	it("先頭から件数ぶん、記号を除いた原文(AC-8 の形)", () => {
		const p = previewLines(m.next, 3, 80);
		expect(p).toEqual(["alpha / alpha2 の値を本物にするか消す", "二", "三"]);
		expect(previewLines(m.next, 0, 80)).toEqual([]);
		expect(previewLines(null, 3, 80)).toEqual([]);
	});
	it("字数はコードポイントで数え、超えたら切って … を付ける", () => {
		const emoji = String.fromCodePoint(0x1f600);
		const s = parseMemo(dated("e", "2026-09-03", [`- ${emoji}${emoji}${emoji}abc`]), DEFAULTS).next;
		expect(previewLines(s, 1, 3)).toEqual([`${emoji}${emoji}${emoji}…`]);
		expect(previewLines(s, 1, 6)).toEqual([`${emoji}${emoji}${emoji}abc`]);
	});
});

describe("表示の文字", () => {
	it("最終更新は本文の日付と時刻のまま", () => {
		expect(updatedText({ y: 2026, m: 8, d: 1, hhmm: null })).toBe("2026-08-01");
		expect(updatedText({ y: 2026, m: 8, d: 20, hhmm: "19:34" })).toBe("2026-08-20 19:34");
		expect(updatedText("missing")).toBe("不明");
		expect(updatedText("unreadable")).toBe("読めない");
	});
	it("注記(FR-18): 1つ目の名前でない・レベル2でない・同名・表", () => {
		const names = DEFAULTS.nextHeadings;
		const notes = (lines: string[]) => sectionNotes(parseMemo(input("n", ["# n", ...lines]), DEFAULTS).next, names);
		expect(notes(["## 次にやること", "- a"])).toEqual([]);
		expect(notes(["### 次にやること", "- a"])).toEqual(["### 次にやること"]);
		expect(notes(["## 次にやること候補", "1. a"])).toEqual(["## 次にやること候補"]);
		expect(notes(["## 次にやること", "| a |", "## 次にやること"])).toEqual(["同名の節 2", "表は数えない"]);
		expect(sectionNotes(null, names)).toEqual([]);
	});
});
