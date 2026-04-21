# YT-Comment-Window

YouTube の通常 watch ページで、コメント欄を右側の独立スクロール領域として表示する Chrome 拡張機能です。初版は `PLANS.md` に沿って、既存のコメント要素を安全に再配置する最小構成を実装しています。

## できること

- Manifest V3 の unpacked extension として読み込めます。
- 拡張機能 popup から `コメント欄をウィンドウ化` を実行できます。
- YouTube watch ページでコメント欄を右カラム上部へ移し、ウィンドウ内部だけをスクロールできます。
- `閉じる` ボタンで元の位置へ戻せます。
- 同一ページでの二重起動や、動画切り替え時の最低限の後始末に対応しています。

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
5. 拡張機能アイコンから popup を開き、`コメント欄をウィンドウ化` を押します。
6. 右カラム上部に表示されたコメントウィンドウの `閉じる` で復元できます。

## 実装メモ

- popup と background と content script のメッセージ種別は `src/shared/messages.js` に集約しています。
- YouTube DOM のセレクタ候補は `src/content/dom-selectors.js` に寄せています。
- SPA 遷移には `yt-navigate-finish` と `MutationObserver` を併用し、動画切り替え時にウィンドウ状態を解除します。

## 手動テストと改善候補

- 手動テスト手順: [docs/manual-test.md](docs/manual-test.md)
- 今後の改善候補: [docs/improvement-notes.md](docs/improvement-notes.md)

## 既知の制約

- YouTube の DOM 変更に強く依存するため、セレクタ変更時には調整が必要です。
- 初版では Live、Shorts、埋め込み再生、ドラッグ移動、自由リサイズは対象外です。
- 画面幅が狭い場合は安全のため起動を見送ります。
