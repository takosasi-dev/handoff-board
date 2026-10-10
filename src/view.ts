// 右サイドバーのパネル(§9.4・FR-10)。プラグインが持つ解析結果から、古い順の行と末尾のまとまりを描く。
// 押すとメモか節の見出しを開く(FR-11。Q-5 は openLinkText に「パス#見出し」を渡す方式)。
// 要素は createEl 系だけで作る(INV-5)。ビューはプラグインに参照を持たせない(§10)。
import { ItemView, Platform, type WorkspaceLeaf } from "obsidian";
import { buildBoard, daysSince, previewLines, sectionNotes, updatedText } from "./board";
import type { MemoError, MemoSummary, Section } from "./parse";
import { isUnsetFolder } from "./settings";
import { S } from "./strings";
import type HandoffBoardPlugin from "./main";

export const VIEW_TYPE = "handoff-board-board";

// 見出しへのリンクを壊しうる文字(§10)。当たればメモを開くだけにする
const UNSAFE_LINK = /[#|^[\]]/;

export class BoardView extends ItemView {
	private showNotStarted = false;    // 「未着手」は既定で閉じる(FR-17)。描き直しても開閉を保つ

	constructor(leaf: WorkspaceLeaf, private readonly plugin: HandoffBoardPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return S.viewTitle;
	}

	getIcon(): string {
		return "list-todo";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	render(): void {
		const el = this.contentEl;
		const scroll = el.scrollTop;
		el.empty();
		el.addClass("hb-board");
		const p = this.plugin;
		const top = el.createDiv({ cls: "hb-top" });
		const countEl = top.createSpan({ cls: "hb-count" });
		const reload = top.createEl("button", { text: S.reload });
		reload.addEventListener("click", () => void p.reloadAll());

		if (!p.loaded) return void el.createDiv({ cls: "hb-status", text: S.loading });
		if (isUnsetFolder(p.settings.memoFolder)) return void el.createDiv({ cls: "hb-status", text: S.unsetFolder });
		if (!this.app.vault.getFolderByPath(p.settings.memoFolder)) {
			return void el.createDiv({ cls: "hb-status", text: S.noFolder(p.settings.memoFolder) });
		}
		const board = buildBoard(p.results.values());
		if (board.total === 0) return void el.createDiv({ cls: "hb-status", text: S.noMemos });
		countEl.setText(S.count(board.total));

		const now = new Date();
		const list = el.createDiv({ cls: "hb-list" });
		for (const m of board.dated) this.row(list, m, now);
		if (board.unknown.length) {
			const g = this.group(S.groupUnknown, true);
			for (const m of board.unknown) this.row(g, m, now);
		}
		if (board.notStarted.length) {
			const g = this.group(S.groupNotStarted(board.notStarted.length), this.showNotStarted, (v) => (this.showNotStarted = v));
			for (const m of board.notStarted) this.row(g, m, now);
		}
		if (board.failed.length) {
			const g = this.group(S.groupFailed, true);
			for (const f of board.failed) this.failedRow(g, f);
		}
		el.scrollTop = scroll;
	}

	private group(title: string, expanded: boolean, onToggle?: (v: boolean) => void): HTMLElement {
		const det = this.contentEl.createEl("details", { cls: "hb-group" });
		det.open = expanded;
		det.createEl("summary", { text: title });
		if (onToggle) det.addEventListener("toggle", () => onToggle(det.open));
		return det;
	}

	private link(parent: HTMLElement, cls: string, text: string, go: () => Promise<void>): void {
		const a = parent.createEl("a", { cls: `hb-link ${cls}`, text, href: "#" });
		a.addEventListener("click", (e) => {
			e.preventDefault();
			void go();
		});
	}

	private row(parent: HTMLElement, m: MemoSummary, now: Date): void {
		const s = this.plugin.settings;
		const row = parent.createDiv({ cls: "hb-row" });

		const l1 = row.createDiv({ cls: "hb-line1" });
		const days = typeof m.updated === "string" ? "" : daysSince(m.updated, now);
		l1.createSpan({ cls: "hb-days", text: typeof days === "number" ? (days < 0 ? S.future : S.days(days)) : "" });
		this.link(l1, "hb-name", m.name, () => this.openMemo(m.path));
		l1.createSpan({ cls: "hb-updated", text: updatedText(m.updated) });

		const l2 = row.createDiv({ cls: "hb-line2" });
		this.link(l2, "hb-next", m.next ? S.next(m.next.items.length) : S.nextNone, () => this.openSection(m.path, m.next));
		if (m.next && m.next.appended > 0) l2.createSpan({ cls: "hb-appended", text: S.appended(m.next.appended) });
		this.link(l2, "hb-open", m.open ? S.open(m.open.items.length) : S.openNone, () => this.openSection(m.path, m.open));
		for (const n of [...sectionNotes(m.next, s.nextHeadings), ...sectionNotes(m.open, s.openHeadings)]) {
			l2.createSpan({ cls: "hb-note", text: n });
		}

		const lines = previewLines(m.next, s.previewCount, s.previewChars);
		if (lines.length) {
			const ul = row.createDiv({ cls: "hb-preview" });
			for (const t of lines) this.link(ul, "hb-item", t, () => this.openSection(m.path, m.next));
		}
	}

	private failedRow(parent: HTMLElement, f: MemoError): void {
		const row = parent.createDiv({ cls: "hb-row hb-failed" });
		this.link(row.createDiv({ cls: "hb-line1" }), "hb-name", f.name, () => this.openMemo(f.path));
		row.createDiv({ cls: "hb-error", text: f.error });
	}

	private async openMemo(path: string): Promise<void> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) return;
		await this.app.workspace.getLeaf(false).openFile(file);
		this.closeDrawer();
	}

	/** 節の見出しへ移動して開く。節が無いか、リンクを壊す文字があればメモを開くだけ */
	private async openSection(path: string, sec: Section | null): Promise<void> {
		if (!sec || sec.heading === "" || UNSAFE_LINK.test(sec.heading) || UNSAFE_LINK.test(path)) return this.openMemo(path);
		await this.app.workspace.openLinkText(`${path}#${sec.heading}`, "", false);
		this.closeDrawer();
	}

	/** iPhone では右のドロワーがノートを覆うので閉じる(AC-9 の「見出しが見えている」) */
	private closeDrawer(): void {
		if (Platform.isMobile) this.app.workspace.rightSplit.collapse();
	}
}
