# Skill: JavaScript Style

## 規約
- インデントはスペース4つ
- 波括弧は必須
- セミコロンあり
- 小さな関数へ分割
- 早期 return を活用
- マジックナンバーや文字列を散らさない

## 例
```js
function isYouTubeWatchPage(url) {
    if (!url) {
        return false;
    }

    return url.includes('youtube.com/watch');
}
```

## DOM 操作
- `querySelector` の失敗を前提に null チェックする
- append 前に既存要素有無を確認する
- イベント listener は必要なら解除手段を用意する

## ログ
- `console.log` の濫用は避ける
- 通常は `console.warn` / `console.error` を使い分ける
- 何が失敗したか分かる接頭辞を付ける
