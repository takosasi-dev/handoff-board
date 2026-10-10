// 設定の型・既定値・data.json の読み込みの補い(§9.2)。見出し名などの形式の言葉はこのファイルの既定値だけに書く(D-5・AC-16)。
// メモのフォルダの既定は空(未設定)。入れた人が最初に設定する。
// obsidian を import しない(vitest で読む)。設定画面は settings-tab.ts。

export interface Settings {
	schemaVersion: 1;
	memoFolder: string;
	nextHeadings: string[];
	openHeadings: string[];
	updatedPrefix: string;
	statusPrefix: string;
	notStartedValue: string;
	appendMarkerPrefix: string;
	previewCount: number;
	previewChars: number;
}

export const DEFAULTS: Readonly<Settings> = {
	schemaVersion: 1,
	memoFolder: "",                                       // 未設定。vault ごとに違うので既定を持たない
	nextHeadings: ["次にやること", "次にやること候補"],   // §8.3: 2語で 11 本すべて見つかる(D-9)
	openHeadings: ["未解決・注意"],                       // D-12
	updatedPrefix: "最終更新:",                           // handoffsync.toml の last_updated_prefix と同じ(D-17)
	statusPrefix: "状態:",                                // handoffstub.toml の status_prefix と同じ
	notStartedValue: "未着手",                            // HandoffStub の雛形の値
	appendMarkerPrefix: "<!-- handoffsync ",              // HandoffSync のマーカーの頭(§8.6)
	previewCount: 3,                                      // 仮(§8.7 が空。Q-14)
	previewChars: 80,                                     // 仮(同上)
};

/** メモのフォルダが未設定か。空・空白だけ・"/"(normalizePath("") の戻り)は vault の直下ではなく未設定として扱う */
export function isUnsetFolder(folder: string): boolean {
	const t = folder.trim();
	return t === "" || t === "/";
}

/** 見出し名の一覧: 前後の空白を除き NFC、空の行は捨てる(§9.2) */
export function cleanList(lines: readonly string[]): string[] {
	return lines.map((x) => x.trim().normalize("NFC")).filter((x) => x !== "");
}

/** 設定画面の数の欄。min 以上の整数だけを受け、それ以外は null(§9.2) */
export function parseCount(text: string, min: number): number | null {
	const t = text.trim();
	if (!/^\d+$/.test(t)) return null;
	const n = Number(t);
	return Number.isSafeInteger(n) && n >= min ? n : null;
}

/** data.json の中身を Settings にする。欠けた項目は既定値。版が違うか壊れていれば既定値で mismatch=true(呼び手が Notice を出し、上書きしない) */
export function normalizeSettings(raw: unknown): { settings: Settings; mismatch: boolean } {
	const base: Settings = { ...DEFAULTS, nextHeadings: [...DEFAULTS.nextHeadings], openHeadings: [...DEFAULTS.openHeadings] };
	if (raw === null || raw === undefined) return { settings: base, mismatch: false };
	if (typeof raw !== "object" || Array.isArray(raw)) return { settings: base, mismatch: true };
	const r = raw as Record<string, unknown>;
	if (r.schemaVersion !== undefined && r.schemaVersion !== 1) return { settings: base, mismatch: true };
	const str = (k: keyof Settings, d: string) => (typeof r[k] === "string" ? r[k] : d);
	const list = (k: keyof Settings, d: string[]) => {
		const v = r[k];
		return Array.isArray(v) && v.every((x) => typeof x === "string") ? cleanList(v) : d;
	};
	const int = (k: keyof Settings, min: number, d: number) => {
		const v = r[k];
		return typeof v === "number" && Number.isSafeInteger(v) && v >= min ? v : d;
	};
	return {
		settings: {
			schemaVersion: 1,
			memoFolder: str("memoFolder", base.memoFolder),
			nextHeadings: list("nextHeadings", base.nextHeadings),
			openHeadings: list("openHeadings", base.openHeadings),
			updatedPrefix: str("updatedPrefix", base.updatedPrefix),
			statusPrefix: str("statusPrefix", base.statusPrefix),
			notStartedValue: str("notStartedValue", base.notStartedValue),
			appendMarkerPrefix: str("appendMarkerPrefix", base.appendMarkerPrefix),
			previewCount: int("previewCount", 0, base.previewCount),
			previewChars: int("previewChars", 1, base.previewChars),
		},
		mismatch: false,
	};
}
