// メモの本文を手に入れるのはこのファイルだけ(INV-2)。メモフォルダ直下の .md かを isMemoPath で確かめてから読む。
// 読み方は Vault の cachedRead(初回と読み直し・リネーム)と、metadataCache の changed で渡される本文だけ。
import { TFile, type App } from "obsidian";
import { isMemoPath } from "./board";
import type { MemoInput } from "./parse";

/** メモフォルダ直下の .md。フォルダが無ければ null */
export function listMemoFiles(app: App, folder: string): TFile[] | null {
	const dir = app.vault.getFolderByPath(folder);
	if (!dir) return null;
	return dir.children.filter((f): f is TFile => f instanceof TFile && isMemoPath(f.path, folder));
}

/** 対象のメモだけ読む。対象外なら null(開かない) */
export async function readMemo(app: App, file: TFile, folder: string): Promise<MemoInput | null> {
	if (!isMemoPath(file.path, folder)) return null;
	return { path: file.path, name: file.basename, text: await app.vault.cachedRead(file) };
}

/** changed イベントで渡された本文を、対象のメモのときだけ受け取る */
export function memoFromEvent(file: TFile, text: string, folder: string): MemoInput | null {
	return isMemoPath(file.path, folder) ? { path: file.path, name: file.basename, text } : null;
}
