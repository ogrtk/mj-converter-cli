# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code（claude.ai/code）向けの指針を提供します。

## プロジェクト概要

これは文字変換表に基づいてCSVファイルの指定した列に対して文字単位での変換を行うCSV文字変換CLIツール（hk-mj-converter）です。このツールは、CSVデータ内の繁体字中国語やその他の文字セットを変換するために設計されています。

## アーキテクチャ

このコードベースはモジュラーなTypeScriptアーキテクチャに従っています：

- **エントリーポイント**: `src/index.ts` - エラーハンドリングとプロセス管理を含むメインエントリー
- **CLIインターフェース**: `src/cli.ts` - コマンドライン引数処理、設定検証、メイン処理の統合
- **コア処理**: `src/processor.ts` - メインの変換ロジックとフロー制御
- **ユーティリティ**:
  - `src/utils/csv.ts` - エンコーディング対応のCSVファイル入出力
  - `src/utils/converter.ts` - 変換表を使用した文字変換ロジック
  - `src/utils/unicode.ts` - Unicode文字処理ユーティリティ
  - `src/utils/logger.ts` - Winstonベースのログシステム
- **型定義**: `src/types/config.ts` - 設定インターフェースと型定義

## 開発コマンド

```bash
# 開発時実行 (tsxで実行)
npm run dev

# 本番用ビルド (esbuildを使用)
npm run build

# ビルド済みCLI実行
npm start

# コード品質管理
npm run lint      # コードチェック
npm run lint:fix  # 自動修正付きコードチェック
npm run format    # コードフォーマット

# テスト実行
npm test          # インタラクティブテスト実行
npm run test:run  # 一回のみテスト実行
npm run test:coverage  # カバレッジ付きテスト実行
```

## 設定システム

このツールはJSON設定ファイル（デフォルト: `config.json`）を使用し、以下の構造を持ちます：
- `conversion.input` - 入力ファイル設定（パス、エンコーディング、ヘッダーなど）
- `conversion.output` - 出力ファイル設定
- `conversion.conversionTable` - CSV変換表ファイルのパス
- `conversion.targetColumns` - 変換対象列のインデックス配列（0ベース）
- `conversion.missingCharacterHandling` - 変換表にない文字の処理方法（'error', 'skip', 'warn'）
- `logging` - ログ設定（レベル、出力先）

## 主要な処理フロー

1. JSONファイルから設定を読み込み・検証
2. 設定に基づいてWinstonロガーを初期化
3. CSVファイルから文字変換表をMapに読み込み
4. 設定可能なエンコーディングとヘッダー処理で入力CSVを読み込み
5. 変換マップを使用して各対象列を文字単位で処理
6. 設定された戦略に従って欠落文字を処理
7. 元のフォーマットを保持して出力CSVを書き込み
8. 統計情報を含む詳細な処理レポートを生成

## 重要な実装詳細

- エンコーディング処理に `iconv-lite` を使用（非UTF8エンコーディングをサポート）
- 文字変換は `unicode.ts` ユーティリティを通じてUnicodeコードポイントレベルで動作
- CSV構造と非対象列を変更せずに保持
- 処理統計とエラー報告を含む詳細なログ機能
- 設定可能な欠落文字戦略による優雅なエラーハンドリング
- 入力・出力両方でヘッダー行処理が設定可能

## エラーハンドリング戦略

このツールは3段階のエラーハンドリングアプローチを実装しています：
- **プロセスレベル**: `index.ts` 内の未キャッチ例外ハンドラー
- **操作レベル**: 詳細なエラー報告を含むtry-catchブロック
- **文字レベル**: 変換文字欠落の設定可能な処理

## テスト構成

包括的なVitestベースのテストスイートが実装されています：
- **ユニットテスト**: `tests/unit/` - 各モジュールの単体テスト
- **統合テスト**: `tests/integration/` - エンドツーエンドテスト
- **テストフィクスチャ**: `tests/fixtures/` - テスト用データファイル
- **カバレッジレポート**: `coverage/` - HTML形式のカバレッジレポート

テスト設定は `vitest.config.ts` で管理され、TypeScript/ESMネイティブ対応です。

## サンプルファイル

`sample/` ディレクトリには、変換プロセスをテストするためのサンプル入力ファイル、変換表、期待される出力が含まれています。

## プロジェクト設定ファイル

- `package.json` - NPMパッケージ設定、依存関係、スクリプト定義
- `tsconfig.json` - TypeScript設定（ES2022、ESNext、strict mode）
- `vitest.config.ts` - Vitestテスト設定
- `.gitignore` - Git除外ファイル設定
- `LICENSE` - MIT License