// settings.ts の読み込みの補い(§9.2)。欠けた項目は既定値、版違い・壊れは既定値で mismatch。
import { describe, expect, it } from "vitest";
import { DEFAULTS, isUnsetFolder, normalizeSettings, parseCount } from "../src/settings";

describe("設定の読み込み(§9.2)", () => {
	it("data.json が無ければ既定値", () => {
		expect(normalizeSettings(undefined)).toEqual({ settings: DEFAULTS, mismatch: false });
		expect(normalizeSettings(null).mismatch).toBe(false);
	});
	it("メモのフォルダの既定は未設定。保存済みの値はそのまま使う", () => {
		expect(isUnsetFolder(normalizeSettings(undefined).settings.memoFolder)).toBe(true);
		expect(normalizeSettings({ schemaVersion: 1, memoFolder: "Handoff" }).settings.memoFolder).toBe("Handoff");
	});
	it.each([["", true], ["  ", true], ["/", true], ["Handoff", false], ["a/b", false]] as const)("未設定か: %j → %s", (folder, want) => {
		expect(isUnsetFolder(folder)).toBe(want);
	});
	it("版違い・壊れた中身は既定値で mismatch", () => {
		expect(normalizeSettings({ schemaVersion: 2, memoFolder: "x" })).toEqual({ settings: DEFAULTS, mismatch: true });
		expect(normalizeSettings("壊れ").mismatch).toBe(true);
		expect(normalizeSettings([1]).mismatch).toBe(true);
	});
	it("欠けた項目・型の違う項目は既定値で埋め、見出し名は整える", () => {
		const { settings, mismatch } = normalizeSettings({ memoFolder: "メモ", nextHeadings: [" 次 ", "", "後"], previewCount: -1, previewChars: 0 });
		expect(mismatch).toBe(false);
		expect(settings.memoFolder).toBe("メモ");
		expect(settings.nextHeadings).toEqual(["次", "後"]);
		expect(settings.openHeadings).toEqual(DEFAULTS.openHeadings);
		expect(settings.previewCount).toBe(DEFAULTS.previewCount);
		expect(settings.previewChars).toBe(DEFAULTS.previewChars);
		expect(normalizeSettings({ previewCount: 0 }).settings.previewCount).toBe(0);
	});
	it("既定値の配列を書き換えても DEFAULTS は変わらない", () => {
		normalizeSettings(undefined).settings.nextHeadings.push("x");
		expect(DEFAULTS.nextHeadings).toHaveLength(2);
	});
});

describe("数の欄(§9.2)", () => {
	it.each([["3", 0, 3], ["0", 0, 0], ["0", 1, null], [" 12 ", 1, 12], ["1.5", 0, null], ["-1", 0, null], ["", 0, null], ["abc", 0, null]] as const)(
		"%s (min %s) → %s", (t, min, want) => {
			expect(parseCount(t, min)).toBe(want);
		});
});
