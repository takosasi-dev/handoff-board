// Handoff Board の入口。ビュー・コマンド2つ・設定画面・イベントを登録し、メモごとの解析結果(パス → 結果)を持つ(§2)。
// 本文の入手は source.ts、解析は parse.ts・board.ts。変わったメモだけ解析し直し、再描画は1フレームに1回(FR-12)。
// 書き込みは saveData() による data.json だけ(INV-1)。
import { normalizePath, Notice, Plugin, TFile, type TAbstractFile } from "obsidian";
import { parseSafe, type MemoResult } from "./board";
import { normalizeSettings, type Settings } from "./settings";
import { HandoffBoardSettingTab } from "./settings-tab";
import { listMemoFiles, memoFromEvent, readMemo } from "./source";
import { S } from "./strings";
import { BoardView, VIEW_TYPE } from "./view";

export default class HandoffBoardPlugin extends Plugin {
	settings!: Settings;
	results = new Map<string, MemoResult>();
	loaded = false;
	private frame = 0;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.registerView(VIEW_TYPE, (leaf) => new BoardView(leaf, this));
		this.addCommand({ id: "open-board", name: S.cmdOpen, callback: () => void this.openBoard() });
		this.addCommand({ id: "reload-board", name: S.cmdReload, callback: () => void this.reloadAll() });
		this.addSettingTab(new HandoffBoardSettingTab(this.app, this));
		this.register(() => window.cancelAnimationFrame(this.frame));

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.metadataCache.on("changed", (file, data) => this.onChanged(file, data)));
			this.registerEvent(this.app.metadataCache.on("deleted", (file) => this.forget(file.path)));
			this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.onMoved(file, oldPath)));
			// 新規作成で changed が来るかは未確認(Q-6)。来なくても行が増えるよう create も拾う
			this.registerEvent(this.app.vault.on("create", (file) => void this.onMoved(file, null)));
			void this.reloadAll();
		});
	}

	async loadSettings(): Promise<void> {
		let raw: unknown;
		let broken = false;
		try {
			raw = await this.loadData();
		} catch {
			broken = true;
		}
		const { settings, mismatch } = normalizeSettings(raw);
		settings.memoFolder = normalizePath(settings.memoFolder);
		this.settings = settings;
		if (broken || mismatch) new Notice(S.noticeSettings);   // data.json は上書きしない(§9.2)
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.reloadAll();                                  // FR-14
	}

	async openBoard(): Promise<void> {
		await this.app.workspace.ensureSideLeaf(VIEW_TYPE, "right", { active: true, reveal: true });
	}

	/** 全メモを読み直す(初回・「読み直す」・設定の保存) */
	async reloadAll(): Promise<void> {
		this.results.clear();
		const files = listMemoFiles(this.app, this.settings.memoFolder) ?? [];
		await Promise.all(files.map(async (f) => {
			const r = await this.readOne(f);
			if (r) this.results.set(f.path, r);
		}));
		this.loaded = true;
		this.scheduleRender();
	}

	private async readOne(file: TFile): Promise<MemoResult | null> {
		try {
			const input = await readMemo(this.app, file, this.settings.memoFolder);
			return input && parseSafe(input, this.settings);
		} catch (e) {
			return { path: file.path, name: file.basename, error: e instanceof Error ? e.message : String(e) };
		}
	}

	private onChanged(file: TFile, data: string): void {
		const input = memoFromEvent(file, data, this.settings.memoFolder);
		if (!input) return;
		this.results.set(file.path, parseSafe(input, this.settings));
		this.scheduleRender();
	}

	private forget(path: string): void {
		if (this.results.delete(path)) this.scheduleRender();
	}

	/** リネーム・移動・新規作成。フォルダの外へ出たら消し、入ったら読む(§2) */
	private async onMoved(file: TAbstractFile, oldPath: string | null): Promise<void> {
		if (!(file instanceof TFile)) {
			if (file.path === this.settings.memoFolder || oldPath === this.settings.memoFolder) this.scheduleRender();
			return;
		}
		const had = oldPath !== null && this.results.delete(oldPath);
		const r = await this.readOne(file);
		if (r) this.results.set(file.path, r);
		if (had || r) this.scheduleRender();
	}

	scheduleRender(): void {
		if (this.frame) return;
		this.frame = window.requestAnimationFrame(() => {
			this.frame = 0;
			for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
				if (leaf.view instanceof BoardView) leaf.view.render();
			}
		});
	}
}
