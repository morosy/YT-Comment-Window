# YT-Comment-Window

YouTube の通常 watch ページで、右カラム内に `コメント` 切り替えを追加し、関連動画の代わりにコメントを表示できる Chrome 拡張機能です。既存のコメント要素を安全に再配置し、ページレイアウトを組み替える方針で実装しています。

## できること

- Manifest V3 の unpacked extension として読み込めます。
- YouTube watch ページを開くと、自動で右カラムのチップ列に `コメント` ボタンを追加します。
- `コメント` ボタンが左端に入り、初期状態で関連動画の代わりにコメント欄を右カラムへ表示します。
- `すべて` や `関連動画` など他のチップを押すと、通常の関連動画表示へ戻せます。
- 同一ページでの二重初期化や、動画切り替え時の最低限の再初期化に対応しています。

## ディレクトリ構成

```text
YT-Comment-Window/
├─ manifest.json
├─ popup/
│  ├─ popup.html
│  ├─ popup.css
│  └─ popup.js
├─ src/
│  ├─ background/
│  │  └─ service-worker.js
│  ├─ content/
│  │  ├─ content.js
│  │  ├─ overlay-controller.js
│  │  ├─ youtube-layout.js
│  │  ├─ dom-selectors.js
│  │  └─ content.css
│  └─ shared/
│     ├─ constants.js
│     └─ messages.js
└─ docs/
   ├─ manual-test.md
   └─ improvement-notes.md
```

## 使い方

1. Chrome の `chrome://extensions/` を開きます。
2. `デベロッパー モード` を有効にします。
3. `パッケージ化されていない拡張機能を読み込む` からこのリポジトリを選択します。
4. YouTube の通常動画ページを開きます。
5. 通常の watch ページを開くと、自動で右カラムにコメントレイアウトが適用されます。
6. 右カラムの `コメント` チップと既存チップを切り替えて表示を確認します。

## 実装メモ

- popup と background と content script のメッセージ種別は `src/shared/messages.js` に集約しています。
- YouTube DOM のセレクタ候補は `src/content/dom-selectors.js` に寄せています。
- 右カラムのチップ列には `コメント` ボタンを自前で差し込み、選択中は関連動画群を隠してコメントを同じ領域へ移動します。
- 既に開いている YouTube タブで content script が未注入の場合は、popup 実行時に background からオンデマンド注入して再試行します。
- SPA 遷移には `yt-navigate-finish` と `MutationObserver` を併用し、動画切り替え時にウィンドウ状態を解除します。

## 手動テストと改善候補

- 手動テスト手順: [docs/manual-test.md](docs/manual-test.md)
- 今後の改善候補: [docs/improvement-notes.md](docs/improvement-notes.md)

## 既知の制約

- YouTube の DOM 変更に強く依存するため、セレクタ変更時には調整が必要です。
- 初版では Live、Shorts、埋め込み再生、ドラッグ移動、自由リサイズ、永続設定は対象外です。
- 画面幅が狭い場合は安全のため起動を見送ります。
