// 設定画面(minAppVersion 1.14.4 なので getSettingDefinitions の宣言型。D-7)。§9.2 の全項目を変えられる(FR-14)。
// 見出し名は1行1つ、数の欄は整数だけ受ける。保存は Plugin.saveData() だけで、保存したら全メモを読み直す(INV-1)。
import { normalizePath, PluginSettingTab, type App, type SettingDefinitionItem } from "obsidian";
import { cleanList, parseCount } from "./settings";
import { S } from "./strings";
import type HandoffBoardPlugin from "./main";

const TEXT_KEYS = ["memoFolder", "updatedPrefix", "statusPrefix", "notStartedValue", "appendMarkerPrefix"] as const;
const LIST_KEYS = ["nextHeadings", "openHeadings"] as const;
const COUNT_MIN = { previewCount: 0, previewChars: 1 } as const;

type TextKey = (typeof TEXT_KEYS)[number];
type ListKey = (typeof LIST_KEYS)[number];
type CountKey = keyof typeof COUNT_MIN;

const isText = (k: string): k is TextKey => (TEXT_KEYS as readonly string[]).includes(k);
const isList = (k: string): k is ListKey => (LIST_KEYS as readonly string[]).includes(k);
const isCount = (k: string): k is CountKey => k in COUNT_MIN;

const intRule = (min: number) => (v: string) => (parseCount(v, min) === null ? S.errInt : undefined);

export class HandoffBoardSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly owner: HandoffBoardPlugin) {
		super(app, owner);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{ type: "group", items: [                    // 最初の組は見出し無し(Plugin guidelines)
				{ name: S.setFolder, desc: S.setFolderDesc, control: { type: "folder", key: "memoFolder" } },
				{ name: S.setPreviewCount, desc: S.setPreviewCountDesc,
					control: { type: "text", key: "previewCount", validate: intRule(COUNT_MIN.previewCount) } },
				{ name: S.setPreviewChars, desc: S.setPreviewCharsDesc,
					control: { type: "text", key: "previewChars", validate: intRule(COUNT_MIN.previewChars) } },
			] },
			{ type: "group", heading: S.setHeadingSections, items: [
				{ name: S.setNextHeadings, desc: S.setHeadingsDesc, control: { type: "textarea", key: "nextHeadings", rows: 3 } },
				{ name: S.setOpenHeadings, desc: S.setHeadingsDesc, control: { type: "textarea", key: "openHeadings", rows: 3 } },
			] },
			{ type: "group", heading: S.setHeadingTools, items: [
				{ name: S.setUpdatedPrefix, desc: S.setUpdatedPrefixDesc, control: { type: "text", key: "updatedPrefix" } },
				{ name: S.setStatusPrefix, control: { type: "text", key: "statusPrefix" } },
				{ name: S.setNotStarted, desc: S.setNotStartedDesc, control: { type: "text", key: "notStartedValue" } },
				{ name: S.setMarkerPrefix, desc: S.setMarkerPrefixDesc, control: { type: "text", key: "appendMarkerPrefix" } },
			] },
		];
	}

	getControlValue(key: string): unknown {
		const s = this.owner.settings;
		if (isList(key)) return s[key].join("\n");
		if (isCount(key)) return String(s[key]);
		if (isText(key)) return s[key];
		return undefined;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const s = this.owner.settings;
		const text = typeof value === "string" ? value : "";
		if (isList(key)) {
			s[key] = cleanList(text.split("\n"));
		} else if (isCount(key)) {
			const n = parseCount(text, COUNT_MIN[key]);
			if (n === null) return;                  // validate で止まる。念のため保存しない(§9.2)
			s[key] = n;
		} else if (key === "memoFolder") {
			s.memoFolder = normalizePath(text);
		} else if (isText(key)) {
			s[key] = text;
		} else {
			return;
		}
		await this.owner.saveSettings();
	}
}
