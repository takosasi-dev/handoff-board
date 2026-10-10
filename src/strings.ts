// 画面に出す文字をまとめた所(D-19)。文字と、値を埋める小さな関数だけ。obsidian を import しない。
// 依頼者の vault の見出し名やフォルダ名はここに書かない(既定値は settings.ts だけ。AC-16)。

export const S = {
	viewTitle: "引き継ぎメモボード",
	cmdOpen: "引き継ぎメモボードを開く",
	cmdReload: "引き継ぎメモボードを読み直す",

	count: (n: number) => `引き継ぎメモ ${n} 本`,
	reload: "読み直す",
	loading: "読み込み中",
	noFolder: (folder: string) => `フォルダ「${folder}」がありません`,
	noMemos: "メモがありません",

	days: (n: number) => `${n}日`,
	future: "未来",
	updatedMissing: "不明",
	updatedUnreadable: "読めない",
	next: (n: number) => `次 ${n}`,
	nextNone: "次 節なし",
	appended: (n: number) => `うち追記 ${n}`,
	open: (n: number) => `未解決 ${n}`,
	openNone: "未解決 節なし",
	sameName: (n: number) => `同名の節 ${n}`,
	tableNotCounted: "表は数えない",

	groupUnknown: "最終更新 不明",
	groupNotStarted: (n: number) => `未着手 ${n} 本`,
	groupFailed: "読めなかったメモ",

	noticeSettings: "Handoff Board: 設定(data.json)の版が違うか読めないため、既定値で動かしています。data.json は書き換えていません。",

	setFolder: "メモのフォルダ",
	setFolderDesc: "このフォルダの直下にある .md だけを読む。サブフォルダの中は見ない。",
	setPreviewCount: "先頭の項目の件数",
	setPreviewCountDesc: "行ごとに出す「次」の節の先頭の項目の数。0 なら出さない。",
	setPreviewChars: "先頭の項目の字数",
	setPreviewCharsDesc: "これを超えた分は切って … を付ける。",
	setHeadingSections: "節の見出し名",
	setNextHeadings: "「次」の節の見出し名",
	setOpenHeadings: "「未解決」の節の見出し名",
	setHeadingsDesc: "1行に1つ。見出しの文字(# の後)と完全一致した最初の見出しの節を使う。見出しの階層は問わない。",
	setHeadingTools: "ほかの道具と合わせる値",
	setUpdatedPrefix: "最終更新の行の頭",
	setUpdatedPrefixDesc: "最初のレベル2の見出しより前で、この文字で始まる行から日付と時刻を読む。",
	setStatusPrefix: "状態の行の頭",
	setNotStarted: "未着手の値",
	setNotStartedDesc: "状態の行の値がこれと一致するメモは、末尾の「未着手」にまとめる。",
	setMarkerPrefix: "追記の印の行の頭",
	setMarkerPrefixDesc: "「次」の節の中で、この文字で始まる行の数を「うち追記」に出す。",
	errInt: "整数を入れてください",
};
