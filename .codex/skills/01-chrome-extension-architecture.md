# Skill: Chrome Extension Architecture

## 採用方針
- Manifest Version 3 を使う。Chrome 拡張機能の現行基盤は MV3。citeturn239732search1turn239732search8
- popup, service worker, content script を明確に分離する。
- DOM 操作は content script に閉じ込める。

## 役割分担
### popup
- ユーザーが押す起点
- 現在タブへ開始命令を送る

### service worker
- タブ情報取得
- popup と content の中継
- 必要に応じてスクリプト挿入

### content script
- YouTube DOM 検出
- コメントウィンドウ生成
- 復元処理
- SPA 遷移追従

## 推奨メッセージ
- `START_WINDOW_MODE`
- `STOP_WINDOW_MODE`
- `PING_PAGE_STATE`
- `PAGE_STATE`

## 権限候補
- `activeTab`
- `scripting`
- `storage`（必要になった時だけ）
- `host_permissions: ["https://www.youtube.com/*"]`

`chrome.scripting` を使う場合は `scripting` 権限と対象ページ権限が必要。citeturn239732search0
