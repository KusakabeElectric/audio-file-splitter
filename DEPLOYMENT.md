# GitHub Desktopでの公開手順

## 現在のフォルダをリポジトリに設定する方法

### 方法1: 新しいリポジトリを作成（推奨）

1. GitHub Desktopを開く
2. メニューから「File」→「New Repository」（または `Ctrl + N`）
3. 以下の設定を行います：
   - **Name**: `audio-file-splitter`（または任意の名前）
   - **Description**: 「音声ファイル分割ツール」（任意）
   - **Local Path**: `C:\Users\yoshida\音声ファイル分割ツール` を選択
   - **Initialize this repository with a README**: **チェックを外す**（既にREADME.mdがあるため）
   - **Git ignore**: None または Custom（.gitignoreファイルを使用）
   - **License**: 必要に応じて選択
4. 「Create Repository」をクリック

### 方法2: 既存のaudiocutterリポジトリを変更

1. GitHub Desktopで「Repository」→「Repository settings」を開く
2. 「Unlink this repository」をクリック
3. その後、方法1で新しいリポジトリを作成

## ファイルをコミット

1. GitHub Desktopの左側に変更されたファイルが表示されます
2. すべてのファイル（`index.html`, `style.css`, `script.js`, `README.md`）が表示されているか確認
3. 左下の「Summary」にコミットメッセージを入力（例：「Initial commit」）
4. 「Commit to main」をクリック

## GitHubにプッシュ

1. 上部の「Publish repository」ボタンをクリック
   - 初回の場合、または「Push origin」ボタンをクリック
2. 「Keep this code private」のチェックを外す（公開リポジトリにする場合）
3. 「Publish repository」をクリック

## GitHub Pagesを有効化

1. GitHubのウェブサイト（github.com）にアクセス
2. 作成したリポジトリを開く
3. 上部の「Settings」タブをクリック
4. 左メニューから「Pages」を選択
5. 「Source」で「Deploy from a branch」を選択
6. 「Branch」で「main」を選択
7. 「/ (root)」を選択
8. 「Save」をクリック

## 公開URLの確認

数分待つと、以下の形式でURLが発行されます：
```
https://[あなたのユーザー名].github.io/[リポジトリ名]/
```

「Settings」→「Pages」でURLを確認できます。

