# AGENTS.md

## プロジェクト概要
- プロジェクト名: `YT-Comment-Window`
- サービス名: `YT-Comment-Window`
- 種別: Chrome拡張機能
- 技術: Vanilla JavaScript / HTML / CSS
- 主目的: YouTube の動画ページ上で、動画を見たままコメント欄を右側の独立スクロール領域として閲覧できるようにする。

## このリポジトリでの役割
Codex はこのリポジトリにおいて、**実装担当**です。
勝手に要件を拡張しすぎず、`PLANS.md` に沿って、段階的に安全に実装してください。

## 最優先原則
1. **まず動く最小構成を作る**
   - 最初から高機能化しない。
   - 初版は「YouTube動画ページで、popup ボタン押下後にコメント欄を右側のウィンドウへ分離表示できること」を最優先とする。
2. **既存のYouTube視聴体験を極力壊さない**
   - 動画プレイヤーの操作を妨げない。
   - YouTube の既存 DOM を必要以上に破壊しない。
   - 可能な限り「元コメント欄を複製表示」ではなく、「既存コメント領域の見え方を調整する」方針を優先する。
3. **要件が曖昧なら、拡張せず記録する**
   - 必要以上の独自判断で機能追加しない。
   - 迷ったら `PLANS.md` の「未確定事項」に従う。
4. **保守しやすい構成にする**
   - JS は責務ごとに分割する。
   - 定数・セレクタ・メッセージ種別を散らさない。

## 技術方針
- Manifest Version は **MV3** を採用する。Chrome 拡張機能の現行基盤は MV3。citeturn239732search1turn239732search8
- 実装は **Vanilla JavaScript** を基本とし、初期段階ではビルドツールを導入しない。
- YouTube ページへの UI 追加は **content script** を中心に実装する。content scripts はページ DOM を読み書きできる。citeturn239732search4
- popup から現在タブに対して処理を開始する場合、`chrome.scripting` の使用を前提としてよい。`scripting` 権限と対象ページの権限宣言が必要。citeturn239732search0
- 永続設定は必要になった段階で `chrome.storage` を使う。citeturn239732search6

## 想定ディレクトリ構成
```text
YT-Comment-Window/
├─ manifest.json
├─ AGENTS.md
├─ PLANS.md
├─ .gitattributes
├─ .gitignore
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
├─ assets/
│  └─ icons/
└─ .codex/
   └─ skills/
```

## コーディング規約
- インデントは **スペース4つ**。
- `if` / `for` / `while` / `switch` などは、本文が1行でも **必ず波括弧 `{}` を付ける**。
- セミコロンは付ける。
- 変数名・関数名は lowerCamelCase、定数は UPPER_SNAKE_CASE。
- DOM セレクタ文字列は直書きせず、可能な限り `dom-selectors.js` に集約する。
- popup / background / content script 間の文字列メッセージは `messages.js` に集約する。
- 1ファイル1責務を意識し、肥大化したら分割する。
- JSDoc を必要箇所に書く。
- 例外は握りつぶさず、`console.warn` / `console.error` で文脈付きログを出す。

## UI/UX方針
- popup には最低限以下を置く。
  - タイトル
  - 説明文
  - `コメント欄をウィンドウ化` ボタン
  - 将来的な `元に戻す` / `ON-OFF` 拡張余地
- 右側コメントウィンドウは以下を満たす。
  - YouTube右カラム付近に表示
  - 独立スクロール可能
  - 動画プレイヤーが画面上部に残る
  - 閉じる導線を持つ
- 初版では **ドラッグ移動・リサイズは必須ではない**。

## DOM操作ルール
- YouTube の DOM 構造は変化しうるため、**頑健なセレクタ探索**を行う。
- セレクタが見つからない場合は無理に壊さず、失敗状態をログ出力して安全に終了する。
- `MutationObserver` を利用して、遅延描画や SPA 遷移に追従できる設計を優先する。
- YouTube のコメント欄読み込み前提で決め打ちしない。

## 実装順序
1. manifest / popup / background / content の最小骨組み
2. popup ボタンからアクティブタブへ開始命令
3. YouTube watch ページ判定
4. コメント領域検出
5. 右カラムへのコメントウィンドウ化 UI 生成
6. 独立スクロールの成立
7. 閉じる/元に戻す
8. SPA 遷移・再初期化対策
9. 例外系の調整

## 禁止事項
- React / TypeScript / Vite などを、発注者の合意なしに導入しない。
- 不要な外部ライブラリを追加しない。
- YouTube の全体レイアウトを大規模に作り替えない。
- API 通信やスクレイピング前提の実装にしない。
- コメント本文を別取得するための外部サーバー構成を勝手に導入しない。

## コミット方針
- 小さく意味のある単位でコミットする。
- 推奨プレフィックス:
  - `[feat]`
  - `[fix]`
  - `[refactor]`
  - `[docs]`
  - `[style]`
  - `[test]`
  - `[chore]`

## 実装時の完了条件
以下を満たしたら初版実装完了候補とする。
- Chrome で unpacked load できる。
- YouTube の通常動画ページで popup ボタンから開始できる。
- コメントを右側の独立スクロール領域として閲覧できる。
- 動画プレイヤー閲覧を妨げない。
- 元に戻すまたは閉じる導線がある。
- 重大な console error が常時出ない。

## 仕様が未確定なときの扱い
未確定事項は勝手に埋め切らず、以下の優先順で判断する。
1. `PLANS.md` の既定値
2. UI を壊しにくい最小案
3. 将来拡張しやすい案

