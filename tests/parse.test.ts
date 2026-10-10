// parse.ts の純関数(最終更新・状態・節・項目の数え方)。本文は合成で、仕様書 §8.3 の形だけを写す(D-21・AC-2)。
import { describe, expect, it } from "vitest";
import { parseMemo, scanHeadings, splitLines, type MemoSummary } from "../src/parse";
import { isMemoPath } from "../src/board";
import { DEFAULTS } from "../src/settings";

const memo = (lines: string[], rules = DEFAULTS): MemoSummary =>
	parseMemo({ path: "引き続きメモ/m.md", name: "m", text: lines.join("\n") }, rules);

const HEAD = ["# 合成 引き継ぎメモ", "", "最終更新: 2026-08-21", ""];

describe("最終更新(FR-2)", () => {
	it("日付だけ・時刻つき", () => {
		expect(memo(HEAD).updated).toEqual({ y: 2026, m: 8, d: 21, hhmm: null });
		expect(memo(["# t", "", "最終更新: 2026-08-20 19:34"]).updated).toEqual({ y: 2026, m: 8, d: 20, hhmm: "19:34" });
	});
	it("行が無い・全角コロンは不明、2026-02-30 は読めない(§10)", () => {
		expect(memo(["# t", "", "## 次にやること", "- a"]).updated).toBe("missing");
		expect(memo(["# t", "最終更新：2026-08-21"]).updated).toBe("missing");
		expect(memo(["# t", "最終更新: 2026-02-30"]).updated).toBe("unreadable");
		expect(memo(["# t", "最終更新: まだ"]).updated).toBe("unreadable");
		expect(memo(["# t", "最終更新: 2024-02-29"]).updated).toEqual({ y: 2024, m: 2, d: 29, hhmm: null });
	});
	it("最初のレベル2の見出しより後の行は見ない", () => {
		expect(memo(["# t", "## 場所", "最終更新: 2026-08-21"]).updated).toBe("missing");
		expect(memo(["# t", "### 小見出し", "最終更新: 2026-08-21"]).updated).toEqual({ y: 2026, m: 8, d: 21, hhmm: null });
	});
	it("最初の行だけを使う", () => {
		expect(memo(["# t", "最終更新: 2026-08-21", "最終更新: 2026-09-01"]).updated).toEqual({ y: 2026, m: 8, d: 21, hhmm: null });
	});
});

describe("BOM・CRLF・NFD(§10)", () => {
	it("先頭の BOM と行末の \\r を除く", () => {
		const text = String.fromCharCode(0xfeff) + ["# t", "最終更新: 2026-08-21 11:23", "## 次にやること", "- a", "- b"].join("\r\n");
		const m = parseMemo({ path: "引き続きメモ/m.md", name: "m", text }, DEFAULTS);
		expect(m.updated).toEqual({ y: 2026, m: 8, d: 21, hhmm: "11:23" });
		expect(m.next?.items).toEqual(["a", "b"]);
	});
	it("NFD の見出しも NFC にして比べる", () => {
		const nfd = "引き継ぎ".normalize("NFD");
		expect(nfd).not.toBe("引き継ぎ");
		const m = memo(["# t", `## ${nfd}`, "- a"], { ...DEFAULTS, nextHeadings: ["引き継ぎ"] });
		expect(m.next?.heading).toBe("引き継ぎ");
		expect(m.next?.items.length).toBe(1);
	});
});

describe("節と項目(FR-5・FR-6・FR-9)", () => {
	it("(a) 番号が重なっても行で数える(4 が2回で 6 件)", () => {
		const m = memo([...HEAD, "## 次にやること候補", "", "1. 一", "2. 二", "3. 三",
			"4. 一番長い一覧は見本の120個。長ければ `ITEMS` を分ける",
			"4. 控えが無いので、大きく直す前に `cp -r` で写しを取る", "5. 六", ""]);
		expect(m.next?.items.length).toBe(6);
		expect(m.next?.heading).toBe("次にやること候補");
		expect(m.next?.items[3]).toBe("一番長い一覧は見本の120個。長ければ `ITEMS` を分ける");
	});
	it("(b) 字下げされた続きの行は数えない", () => {
		const m = memo([...HEAD, "## 次にやること", "",
			"- **動かして確かめるのが先**(前から残っている一番重い項目)。特に今回のv1.2.0分",
			"  (一覧の合計が明細の合計と合うか、切り替えで表示が崩れないか)",
			"- 二つ目"]);
		expect(m.next?.items).toEqual(["**動かして確かめるのが先**(前から残っている一番重い項目)。特に今回のv1.2.0分", "二つ目"]);
	});
	it("(c) 子項目は数えない(未解決は字下げ無しだけ)", () => {
		const m = memo([...HEAD, "## 未解決・注意", "", "- **一覧の画面が「一部だけ」になる**", "  - 子項目1",
			"  - 設定でスイッチを入れ直せば、足りない分だけ作り直される", "", "- **手で確かめていないこと**", "  - 子項目2",
			"## 次にやること", "1. a"]);
		expect(m.open?.items.length).toBe(2);
		expect(m.next?.items.length).toBe(1);
	});
	it("(d) 節の中の項目でない文・<!-- の行は数えない", () => {
		const m = memo([...HEAD, "## 次にやること", "1. a", "2. b", "", "関連: [[2026-01-18]](日誌)・[[2026-01-21]](日誌)",
			"<!-- handoffstub spec_dir=x created=2026-09-26 -->", "-ハイフンの後に空白なし", "1) 括弧の番号", "* 星", "+ 足す", "- [ ] チェック"]);
		expect(m.next?.items).toEqual(["a", "b", "[ ] チェック"]);
	});
	it("(e) コードブロックの中の # の行は見出しにしない・中の項目は数えない", () => {
		const lines = [...HEAD, "## やったこと", "- 設定のメモに足した", "  ```markdown", "  # 作業の進め方の決まり", "", "## 偽の見出し",
			"- 中の項目", "  ```", "", "## 次にやること", "- a", "```", "- コードの中", "# 中の見出し", "```", "- b"];
		const m = memo(lines);
		expect(m.next?.items).toEqual(["a", "b"]);
		const { headings } = scanHeadings(splitLines(lines.join("\n")));
		expect(headings.map((h) => h.text)).toEqual(["合成 引き継ぎメモ", "やったこと", "次にやること"]);
	});
	it("(f) 1件目が「無し」でもそのまま数える(D-15・INV-8)", () => {
		const m = memo([...HEAD, "## 次にやること", "",
			"- 現状は追加の頼まれ事・やり残しは無し。全3件の頼まれ事は実装とテストまで終わり、報告済み。",
			"- 新しい版で「複製した項目が開けるか」を手元(画面の上)で確かめる予定 → 結果待ち。", "", "## 開発ログ", "- 数えない"]);
		expect(m.next?.items.length).toBe(2);
		expect(m.next?.items[0]?.startsWith("現状は追加")).toBe(true);
	});
	it("節は次の同じか浅い見出しまで。深い見出しは中に含む", () => {
		const m = memo([...HEAD, "### 次にやること", "- a", "#### 細目", "- b", "### 別", "- c"]);
		expect(m.next?.level).toBe(3);
		expect(m.next?.items).toEqual(["a", "b"]);
	});
	it("節が無ければ null、項目 0 なら空(節なし と 0 の区別。FR-9)", () => {
		expect(memo(HEAD).next).toBeNull();
		expect(memo(HEAD).open).toBeNull();
		expect(memo([...HEAD, "## 次にやること", "", "## 開発ログ"]).next?.items).toEqual([]);
	});
	it("前方一致では拾わない・完全一致(前後の空白は除く)", () => {
		expect(memo([...HEAD, "## 次にやることの背景", "- a"]).next).toBeNull();
		expect(memo([...HEAD, "##  次にやること  ", "- a"]).next?.items.length).toBe(1);
	});
	it("同名の節が2つなら最初を使い、数を持つ", () => {
		const m = memo([...HEAD, "## 次にやること", "- a", "## 次にやること候補", "- b", "- c"]);
		expect(m.next?.items).toEqual(["a"]);
		expect(m.next?.sameName).toBe(2);
	});
	it("表の行は数えず、表があることを持つ", () => {
		const m = memo([...HEAD, "## 次にやること", "| 列 | 列 |", "|---|---|", "| - a | b |", "- 項目"]);
		expect(m.next?.items).toEqual(["項目"]);
		expect(m.next?.hasTable).toBe(true);
	});
	it("見出し名の一覧が空なら全部 節なし", () => {
		const m = memo([...HEAD, "## 次にやること", "- a", "## 未解決・注意", "- b"], { ...DEFAULTS, nextHeadings: [], openHeadings: [""] });
		expect(m.next).toBeNull();
		expect(m.open).toBeNull();
	});
});

describe("追記と雛形(FR-16・FR-17・AC-11・AC-12)", () => {
	const MARK = "<!-- handoffsync src=開発ログ/2026-09-26.md#10:00 fp=000000000000 added=2026-09-26 -->";
	it("番号の節に追記2行で 4 → 5、うち追記 1", () => {
		const m = memo([...HEAD, "## 次にやること", "1. a", "2. b", "3. c", "4. d", "5. テスト追記", MARK, "", "## 開発ログ"]);
		expect(m.next?.items.length).toBe(5);
		expect(m.next?.appended).toBe(1);
	});
	it("§8.6 の形(- **…**: … とマーカー)も1件", () => {
		const m = memo([...HEAD, "## 次にやること", "- 手元で1回確かめる", "- **未検証で残したもの**: 見本の項目",
			"<!-- handoffsync src=開発ログ/2026-09-09.md#10:00 fp=a1b2c3d4e5f6 added=2026-09-10 -->", ""]);
		expect(m.next?.items.length).toBe(2);
		expect(m.next?.appended).toBe(1);
	});
	it("マーカー行だけなら件数は変わらない", () => {
		expect(memo([...HEAD, "## 次にやること", "- a", MARK]).next?.items.length).toBe(1);
	});
	it("HandoffStub の雛形: 未着手・最終更新 不明・次 0", () => {
		const m = memo(["# 新しい仕様 引き継ぎメモ", "", "状態: 未着手", "起票: 2026-09-26 (HandoffStub)", "", "## プロジェクトの場所", "",
			"- 仕様書: `仕様書MDファイル/x/x_仕様書.md`", "- 開発フォルダ: (未定)", "", "## 現状", "", "- 未着手。仕様書 §12 Phase 0 から。", "",
			"## 次にやること", "", "<!-- handoffstub spec_dir=x created=2026-09-26 -->", ""]);
		expect(m.notStarted).toBe(true);
		expect(m.updated).toBe("missing");
		expect(m.next?.items.length).toBe(0);
		expect(m.next?.appended).toBe(0);
	});
	it("状態が未着手でなければ notStarted ではない", () => {
		expect(memo(["# t", "状態: **実装完了・手での確認待ち**。", "最終更新: 2026-09-21"]).notStarted).toBe(false);
	});
});

describe("対象のパス(FR-1・AC-2)", () => {
	it.each([
		["引き続きメモ/NoteDesk.md", true],
		["引き続きメモ/_handoffsync/2026-09-09_候補.md", false],
		["仕様書MDファイル/a.md", false],
		["引き続きメモ/a.txt", false],
		["引き続きメモ/NoteDesk.md.handoffsync.tmp", false],
		["引き続きメモ2/a.md", false],
	])("%s → %s", (p, want) => {
		expect(isMemoPath(p, "引き続きメモ")).toBe(want);
	});
	it.each(["", "  ", "/"])("フォルダが未設定(%j)なら vault の直下も対象にしない", (folder) => {
		expect(isMemoPath("a.md", folder)).toBe(false);
		expect(isMemoPath("x/a.md", folder)).toBe(false);
	});
});
