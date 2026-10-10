# Handoff Board

引き継ぎメモ(プロジェクトごとに「どこまでやったか・次に何をやるか」を書いておくノート)を、右サイドバーに最終更新の古い順で並べる Obsidian プラグインです。メモごとに、最終更新からの日数・「次にやること」の件数と先頭の数件・「未解決」の件数を出します。ノートは読むだけで 1 つも書き換えず、ネットワークにも出ません。PC とモバイル(iPhone・Android)の両方に向けて作ってあります。

*English summary is at the bottom.*

## できること

- **古い順に並べる**: 本文の「最終更新:」の行の日付で並べ、今日までの日数を出します。長く見直していないメモが上に来ます。
- **次にやることの件数と先頭**: 「次にやること」の節の項目を数え、先頭の数件(既定は 3 件・80 字まで)をそのまま出します。
- **未解決の件数**: 「未解決・注意」の節の項目を数えます。
- **押して開く**: メモ名を押すとメモを、件数か先頭の項目を押すとその節の見出しを開きます。モバイルでは、開いたあとに右のドロワーを閉じます。
- **自動で直す**: メモを書き換える・足す・消す・名前を変えると、押さなくても行が変わる作りです。
- **末尾にまとめる**: 最終更新が読めないメモ、まだ手を付けていないメモ(`状態: 未着手`)、読めなかったメモは、末尾の組に分けます。
- **見出しの揺れを添える**: 節の見出しが別名・`##` 以外・同名が 2 つ・表を含む、のときは行にその旨を添えます。

## 向いている vault(前提)

1 つのフォルダの**直下**に、プロジェクトごとのメモを 1 本ずつ置く形を前提にしています。どのフォルダかは、入れたあとに設定の「メモのフォルダ」で指定します(下の例では `Handoff`)。ファイル名(拡張子なし)が、そのまま一覧の名前になります。サブフォルダの中は見ません。

```markdown
# 写真整理ツール 引き継ぎメモ

最終更新: 2026-08-20 19:34

## 現状
- 取り込みまで動く

## 次にやること
1. 取り込みの重複チェックを直す
2. 一覧の並べ替えを足す
   - 字下げした行は数えない

## 未解決・注意
- **大きい画像で遅い**
```

このメモ(`Handoff/写真整理ツール.md`)は、2026-09-26 に見ると次のように出ます。

```
37日  写真整理ツール  2026-08-20 19:34
      次 2  未解決 1
      ・取り込みの重複チェックを直す
      ・一覧の並べ替えを足す
```

読み方の決まり:

- **最終更新**: 最初の `##` の見出しより前にある、`最終更新:` で始まる最初の行から読みます。形は `最終更新: 2026-08-20` か `最終更新: 2026-08-20 19:34`(コロンは半角で、後ろに空白)。ファイルの更新日時は、並べ替えにも表示にも使いません(同期や一括の書き換えで動くため)。
- **節**: 見出しの文字が「次にやること」か「次にやること候補」(未解決は「未解決・注意」)と完全に一致する、最初の見出しの節を使います。`##` でも `###` でも構いません。節は、次の同じか浅い階層の見出しまでです。
- **項目**: 字下げの無い `- ` か `1. ` で始まる行が 1 件です。字下げした子項目、`* ` や `+ ` の箇条書き、表の行、コードブロックの中は数えません。文言は見ないので、「特になし」も `- [ ]` も 1 件です。
- **未着手**: 最初の `##` より前に `状態: 未着手` の行があるメモは、末尾の「未着手 N 本」にまとめます。
- **追記の印**: 「次」の節の中の `<!-- handoffsync ` で始まる行の数を「うち追記 N」と出します。作者の手元の道具が項目を足したときに付ける印で、無ければ何も出ません。

節の見出し名・行の頭の文字の既定は、作者の vault の書き方に合わせてあります。設定の「「次」の節の見出し名」「「未解決」の節の見出し名」「最終更新の行の頭」などを、自分の vault に合わせて書き換えてください。「メモのフォルダ」には既定が無いので、最初に指定します。

## 入れ方

### BRAT で入れる(おすすめ)

1. コミュニティプラグインの「BRAT」(Obsidian42 - BRAT)を入れて有効にする。
2. BRAT の設定 → 「Add Beta plugin」に `takosasi-dev/handoff-board` を入れる。
3. コミュニティプラグインの一覧で「Handoff Board」を有効にする。

### 手で入れる

[Releases](https://github.com/takosasi-dev/handoff-board/releases) から `main.js`・`manifest.json`・`styles.css` を落とし、vault の `.obsidian/plugins/handoff-board/` に置いて、コミュニティプラグインの一覧で有効にします。

### 入れたら最初に設定する

設定 → Handoff Board の「メモのフォルダ」に、引き継ぎメモを置いているフォルダ(例: `Handoff`)を指定します。既定は空(未設定)です。未設定のあいだは何も読まず、パネルに「メモのフォルダが未設定です。設定 → Handoff Board で指定してください」と出ます。

## 使い方

### コマンド

| コマンドパレットに出る名前 | すること |
|---|---|
| Handoff Board: 引き継ぎメモボードを開く | 右サイドバーにパネル「引き継ぎメモボード」を出す |
| Handoff Board: 引き継ぎメモボードを読み直す | 全部のメモを読み直す(パネルの「読み直す」と同じ) |

既定のホットキーはありません。

### 画面の見方

- 上端: 「引き継ぎメモ N 本」と「読み直す」のボタン
- 1 行目: 日数(「12日」。最終更新が今日より後なら「未来」)・メモ名・最終更新(本文に書いてある日付と時刻のまま)
- 2 行目: 「次 N」・「うち追記 N」・「未解決 N」。節が無いメモは「次 節なし」「未解決 節なし」(0 件とは分けて出します)
- 2 行目の後ろの添え書き: 実際の見出し行(`### 次にやること` や `## 次にやること候補` のように、設定の 1 つ目の名前でないか `##` でないとき)・「同名の節 N」・「表は数えない」
- その下: 「次」の節の先頭の項目。字数を超えた分は切って … が付きます
- 末尾の組: 「最終更新 不明」・「未着手 N 本」(畳んである)・「読めなかったメモ」
- メモが出ないとき: 「読み込み中」「メモのフォルダが未設定です。設定 → Handoff Board で指定してください」「フォルダ「Handoff」がありません」「メモがありません」のどれかが出ます。未設定のまま「引き継ぎメモボードを読み直す」を使うと、同じ未設定の文が知らせにも出ます

## 設定

| 項目 | 既定 | 内容 |
|---|---|---|
| メモのフォルダ | 空(未設定) | このフォルダの直下にある .md だけを読む。サブフォルダの中は見ない。未設定のあいだは何も読まない(例: Handoff)。 |
| 先頭の項目の件数 | 3 | 行ごとに出す「次」の節の先頭の項目の数。0 なら出さない。 |
| 先頭の項目の字数 | 80 | これを超えた分は切って … を付ける。 |
| 「次」の節の見出し名 | `次にやること`・`次にやること候補` | 1行に1つ。見出しの文字(# の後)と完全一致した最初の見出しの節を使う。見出しの階層は問わない。 |
| 「未解決」の節の見出し名 | `未解決・注意` | 同じ |
| 最終更新の行の頭 | `最終更新:` | 最初のレベル2の見出しより前で、この文字で始まる行から日付と時刻を読む。 |
| 状態の行の頭 | `状態:` | 未着手かどうかを読む行の頭 |
| 未着手の値 | `未着手` | 状態の行の値がこれと一致するメモは、末尾の「未着手」にまとめる。 |
| 追記の印の行の頭 | `<!-- handoffsync ` | 「次」の節の中で、この文字で始まる行の数を「うち追記」に出す。 |

件数と字数の欄に整数でない値を入れると「整数を入れてください」と出て、保存されません。設定を変えると、全部のメモを読み直します。下の 4 つは、設定画面では「ほかの道具と合わせる値」の組に入っています。

## 安全のための決まり

- vault のノートは 1 つも書き換えません。作る・消す・動かす・名前を変える、もしません。書くのはこのプラグイン自身の設定(プラグインのフォルダの `data.json`)だけです。
- 読むのは「メモのフォルダ」の直下の `.md` だけです。ほかのノートの本文は開きません。vault の外は読みません。
- ネットワークに出ません。Node.js / Electron の機能を使いません(モバイルでも動く作りです)。
- クリップボードは使いません。
- 件数は行の形だけで数え、文言から「済んだ・済んでいない」を判断しません。メモの本文は文字として出すだけです。
- `data.json` の版が違うか読めないときは既定値で動き、`Handoff Board: 設定(data.json)の版が違うか読めないため、既定値で動かしています。data.json は書き換えていません。` と知らせます(そのあと設定画面で値を変えると、保存し直します)。

## 動作確認の状況

- 版 0.1.1。Windows の Obsidian 1.14.4 で動作を確認(パネルにメモが並ぶこと、「次」を押すと節の見出しの行に移ること、メモのフォルダが未設定のときにパネルと「引き継ぎメモボードを読み直す」の知らせに案内が出て、vault の直下のノートを並べないこと)
- iPhone・Android の実機は未確認(モバイル表示のエミュレーションで、読み込み・表示・移動のあとにドロワーが閉じることまで確認)
- まだ確かめていない事: メモを書き換えたとき押さずに行が変わること、設定を変えたときの読み直し(どちらも Obsidian の画面では未確認)、閲覧モード(読み取りビュー)での見出しへの移動

## 分かっている限界

- 日数は「今日の日付 − 最終更新の日付」です。開いたまま日付をまたぐと、次に描き直すまで前の日のままです。
- `最終更新:` の行が無いメモと全角コロンの `最終更新：` は「不明」、実在しない日付やコロンの後に空白が無い行は「読めない」になり、どちらも末尾の「最終更新 不明」に入ります。
- 節の見出しかパスに `#`・`|`・`^`・`[`・`]` があると、節へは動かず、メモを開くだけになります。
- 同名の節が 2 つあれば最初の物だけを使います。表の行は数えません(どちらも行に添え書きが出ます)。
- 先頭の項目の `**…**` などの記法は、文字のまま出ます。
- フォルダ直下の `.md` は全部並びます。メモごとに外す設定はありません。
- vault の直下(どのフォルダにも入れていないノート)を、メモのフォルダとして指定することはできません。空や `/` は未設定として扱います。

## 開発

```
npm install
npm run build        # main.js を作る(型チェックつき)
npm test             # vitest
npm run lint         # eslint-plugin-obsidianmd
```

読み取りと並べ替え(`src/parse.ts`・`src/board.ts`)は obsidian を import しない関数で、テストは作り物のメモだけを使います。

## ライセンス

MIT。[LICENSE](LICENSE) を見てください。

---

## English summary

**Handoff Board** lists your handoff notes in a right-sidebar panel, oldest first, with the days since the last update, the number of next steps and open issues, and the first few next steps.

- It expects one note per project directly inside one folder (subfolders are ignored). The note name becomes the row name.
- **Set the folder first**: Settings → Handoff Board → "メモのフォルダ" (for example `Handoff`). It is empty by default, and nothing is read until you set it; the panel shows a one-line reminder instead. The vault root cannot be used as the folder.
- The last-update date is read from a body line such as `最終更新: 2026-08-20 19:34` placed before the first `##` heading. File modification times are never used.
- Next steps and open issues are counted in the sections whose heading text exactly matches the configured names (defaults `次にやること` / `次にやること候補` and `未解決・注意`). One unindented line starting with `- ` or `1. ` is one item; nested items, table rows and code blocks are not counted.
- Clicking a note name opens the note; clicking a count or a preview item opens the note at that heading. Rows update when notes are changed, added, deleted or renamed.
- Read-only: it never creates, changes, moves or deletes vault files. It writes only its own `data.json`. No network requests, no clipboard, no Node.js or Electron APIs.
- The heading names and line prefixes default to the author's Japanese wording; change them in the settings.
- Install with BRAT (`takosasi-dev/handoff-board`) or copy `main.js`, `manifest.json` and `styles.css` from the latest release into `.obsidian/plugins/handoff-board/`.
- The UI is in Japanese. Tested on Obsidian 1.14.4 for Windows only; mobile was checked only with mobile emulation, not on real devices.
