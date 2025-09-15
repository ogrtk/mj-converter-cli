# CSV文字変換CLIツール - クイックマニュアル

## セットアップ手順

### 1. Node.jsのインストール

1. **Node.jsのダウンロード**
   - [Node.js公式サイト](https://nodejs.org/)にアクセス
   - 「LTS」版（推奨版）をダウンロード
     - バージョンは22以降を選んでください

2. **インストール**
   - 使用する端末で、インストーラー（.msiファイル）を実行してインストール
     - 基本的に推奨設定のままインストールしてください
   - インストールできたことを確認
      - Windowsキー + R を押して「cmd」と入力してEnter
      - コマンドプロンプトで以下を実行：
          ```cmd
          node --version
          npm --version
          ```
      - バージョンが表示されればインストール完了です

### 2. プロジェクトファイルの取得

#### GitHubからZIPファイルをダウンロード
1. **ダウンロード**
   - GitHubのプロジェクトページにアクセス
     - https://github.com/ogrtk/mj-converter-cli
   - 緑色の「Code」ボタンをクリック
   - 「Download ZIP」を選択してダウンロード

2. **ファイル展開**
   - ダウンロードしたZIPファイルを右クリック
   - 「すべて展開」を選択（Windows）
   - 適当なフォルダ（例：`C:\projects\`）に展開

### 3. プロジェクトのセットアップ

1. **コマンドプロンプトを開く**
   - Windowsキー + R を押す
   - 「cmd」と入力してEnter
   - または、スタートメニューから「コマンドプロンプト」を検索

2. **プロジェクトフォルダに移動**
   ```cmd
   cd C:\projects\mj-converter-cli-main
   ```
   ※展開したフォルダのパスに合わせて調整してください

3. **依存関係のインストール**
   ```cmd
   npm install
   ```
   ※インターネット接続が必要です。数分かかる場合があります。

4. **プロジェクトのビルド**
   ```cmd
   npm run build
   ```
   ※成功すると「✓ Built successfully」などのメッセージが表示されます

### 4. 設定ファイルの準備
`config.json`を作成（サンプル: `sample/config.json`を参考）：

```json
{
  "conversion": {
    "input": {
      "path": "input.csv",
      "encoding": "utf8",
      "hasHeader": true
    },
    "output": {
      "path": "output.csv",
      "encoding": "utf8",
      "hasHeader": true
    },
    "conversionTable": "conversion.csv",
    "targetColumns": [1, 2],
    "missingCharacterHandling": "warn",
    "characterSetValidation": {
      "enabled": true,
      "targetEncoding": "shift_jis",
      "undefinedCharacterHandling": "warn",
      "altChar": "?"
    }
  },
  "logging": {
    "level": "info",
    "output": "console"
  }
}
```

#### 設定項目の詳細解説

**conversion セクション**

| 項目 | 説明 | 必須 | 例 |
|------|------|------|-----|
| `input.path` | 入力CSVファイルのパス | ○ | `"data/input.csv"` |
| `input.encoding` | 入力ファイルの文字エンコーディング | | `"utf8"`, `"shift_jis"`, `"cp932"` |
| `input.hasHeader` | 入力ファイルにヘッダー行があるか | | `true`（デフォルト: `false`） |
| `output.path` | 出力CSVファイルのパス | ○ | `"result/output.csv"` |
| `output.encoding` | 出力ファイルの文字エンコーディング | | `"utf8"`, `"shift_jis"`, `"cp932"` |
| `output.hasHeader` | 出力ファイルにヘッダー行を含めるか | | `true`（入力にヘッダーがある場合のみ） |
| `conversionTable` | 文字変換表CSVファイルのパス | ○ | `"tables/conversion.csv"` |
| `targetColumns` | 変換対象の列番号（0から開始） | ○ | `[1, 2, 4]` |
| `missingCharacterHandling` | 変換表にない文字の処理方法 | | `"error"`, `"skip"`, `"warn"` |

**characterSetValidation セクション（オプション）**
指定した範囲の文字セットに含まれるかを検証するオプションです。
例：jis90の範囲に含まれるかを検証する場合、targetEncodingに`shift_jis`を指定します

| 項目 | 説明 | デフォルト | 例 |
|------|------|----------|-----|
| `enabled` | 文字エンコーディング検証の有効化 | `false` | `true` |
| `targetEncoding` | 検証対象のエンコーディング | | `"shift_jis"`, `"shift_jis-2004"` |
| `undefinedCharacterHandling` | エンコード不可文字の処理 | `"error"` | `"error"`, `"warn"` |
| `altChar` | 警告時の置換文字 | | `"?"`, `"■"`, `"※"` |

**logging セクション**

| 項目 | 説明 | デフォルト | 例 |
|------|------|----------|-----|
| `level` | ログレベル | `"info"` | `"error"`, `"warn"`, `"info"`, `"debug"` |
| `output` | ログ出力先 | `"file"` | `"console"`, `"file"` |
| `logFile` | ログファイルのパス（file出力時） | 自動生成 | `"logs/custom.log"` |

#### 設定例

**最小構成**:
```json
{
  "conversion": {
    "input": { "path": "input.csv" },
    "output": { "path": "output.csv" },
    "conversionTable": "conversion.csv",
    "targetColumns": [0]
  }
}
```

**Shift_JIS入出力の例**:
```json
{
  "conversion": {
    "input": {
      "path": "sjis-input.csv",
      "encoding": "shift_jis",
      "hasHeader": true
    },
    "output": {
      "path": "sjis-output.csv", 
      "encoding": "shift_jis",
      "hasHeader": true
    },
    "conversionTable": "conversion.csv",
    "targetColumns": [1, 3],
    "characterSetValidation": {
      "enabled": true,
      "targetEncoding": "shift_jis",
      "undefinedCharacterHandling": "warn",
      "altChar": "■"
    }
  }
}
```

## 実行方法

1. **コマンドプロンプトでプロジェクトフォルダに移動**
   ```cmd
   cd C:\projects\ps-mjconv-main
   ```

2. **実行コマンド**
   ```cmd
   # デフォルト設定ファイル使用
   npm start

   # 設定ファイル指定
   npm start -- --config my-config.json

   # 入力・出力ファイルをパラメータで指定（設定ファイルの値を上書き）
   npm start -- --input data.csv --output result.csv

   # 設定ファイルと入力・出力ファイルの両方を指定
   npm start -- --config my-config.json --input data.csv --output result.csv

   # 詳細ログ表示
   npm start -- --config config.json --verbose
   ```

3. **Windows用バッチファイル実行**
   ```cmd
   # デフォルト設定ファイル使用
   run.bat

   # 設定ファイル指定
   run.bat my-config.json

   # 入力・出力ファイルをパラメータで指定
   run.bat --input data.csv --output result.csv

   # 設定ファイルと入力・出力ファイルの両方を指定
   run.bat my-config.json --input data.csv --output result.csv

   # バッチモード（自動終了）
   run.bat my-config.json --batch

   # 全パラメータを組み合わせ
   run.bat my-config.json --input data.csv --output result.csv --batch
   ```

### コマンドラインパラメータ

| パラメータ | 短縮形 | 説明 | npm start例 | run.bat例 |
|------------|--------|------|-------------|-----------|
| `--config` | `-c` | 設定ファイルのパス | `--config my-config.json` | `my-config.json` |
| `--input` | `-i` | 入力CSVファイルのパス（設定ファイルを上書き） | `--input data.csv` | `--input data.csv` |
| `--output` | `-o` | 出力CSVファイルのパス（設定ファイルを上書き） | `--output result.csv` | `--output result.csv` |
| `--verbose` | `-v` | 詳細ログ表示 | `--verbose` | （未対応） |
| `--batch` | | 自動終了モード（エラー時pauseなし） | （未対応） | `--batch` |
| `--help` | | ヘルプ表示 | `--help` | （未対応） |

**パラメータ優先順位**:
- `--input`と`--output`が指定された場合、設定ファイル内のパスより優先されます
- 他の設定項目（エンコーディング、ヘッダー設定など）は設定ファイルから読み込まれます

**run.bat特有の仕様**:
- パラメータの順序は自由ですが、設定ファイルパスは`--`で始まらないパラメータとして認識されます
- 例: `run.bat config.json --input data.csv --batch` → 設定ファイル=config.json、入力ファイル=data.csv、バッチモード有効

## リターンコード

| コード | 意味 | 説明 |
|--------|------|------|
| **0** | 正常完了 | 処理が問題なく完了 |
| **1** | エラー発生 | 処理中にエラーが発生して停止 |
| **2** | 警告付き完了 | 処理は完了したが警告あり |

## 文字対応表の更新方法

### 1. 基本的な変換表の作成/更新

変換表は CSV 形式で以下のように作成：

```csv
変換前文字,変換後文字
龍,龙
鳳,凤
車,车
```

**重要事項**:
- ヘッダー行は不要
- 1列目：変換前の文字
- 2列目：変換後の文字
- UTF-8エンコーディングで保存

### 2. 複合データからの変換表生成

（特定の団体向け）複数の文字情報を含むマスターデータから変換表を生成する場合：

#### 入力データ形式
```csv
HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
1-16-01,亜,1-16-01,1,U+4E9C,亞,,，U+4E9C,亞
```

#### 変換表生成コマンド

```bash
# 基本的な使用方法
npm run mojimap-converter 入力ファイル.csv MJ→HK変換表.csv HK→MJ変換表.csv

# 実際の例
npm run mojimap-converter master-data.csv mj-to-hk.csv hk-to-mj.csv

# ヘルプ表示
npm run mojimap-converter -- --help
```

**実行例**:
```bash
npm run mojimap-converter mojimap/sample-mapping.csv mojimap/mj-to-hk.csv mojimap/hk-to-mj.csv
```

実行すると以下のような出力が表示されます：
```
Converting mapping table...
Input file: mojimap/sample-mapping.csv
Output MJtoHK: mojimap/mj-to-hk.csv
Output HKtoMJ: mojimap/hk-to-mj.csv
Generated MJtoHK mapping: mojimap/mj-to-hk.csv (15 entries)
Generated HKtoMJ mapping: mojimap/hk-to-mj.csv (15 entries)
Conversion completed successfully!
```

### 3. 変換表の動作確認

#### 3-1. 設定ファイルの更新

生成した変換表を使用するため、設定ファイルの`conversionTable`項目を更新します：

```json
{
  "conversion": {
    "input": {
      "path": "sample/sample-input.csv",
      "encoding": "utf8",
      "hasHeader": true
    },
    "output": {
      "path": "test-output.csv",
      "encoding": "utf8",
      "hasHeader": false
    },
    "conversionTable": "mojimap/hk-to-mj.csv",  // 生成した変換表のパスを指定
    "targetColumns": [1, 2, 4],
    "missingCharacterHandling": "warn"
  },
  "logging": {
    "level": "info",
    "output": "console"
  }
}
```

**変換表の選択**:
- **HK→MJ変換**: `"mojimap/hk-to-mj.csv"` （香港繁体字→日本漢字）
- **MJ→HK変換**: `"mojimap/mj-to-hk.csv"` （日本漢字→香港繁体字）

#### 3-2. 動作確認の実行

```bash
# 1. デフォルト設定ファイルを使用（事前にconversionTableを更新）
npm start

# 2. テスト専用の設定ファイルを作成して使用
npm start -- --config test-config.json

# 3. パラメータで入力・出力を指定
npm start -- --input sample/sample-input.csv --output test-output.csv

# 4. 詳細ログで変換内容を確認
npm start -- --input sample/sample-input.csv --output test-output.csv --verbose
```

#### 3-3. 変換結果の確認

実行後、以下を確認してください：

**ログ出力の例**:
```
変換ルール数: 15件
文字変換表読み込み完了: 有効15件, エラー0件
列2: "專門學校" → "専門学󠄀校"
列3: "繁體字文書" → "繁体字文󠄁書"
処理が正常に完了しました。処理行数: 5行
```

**確認ポイント**:
- 変換ルール数が正しく読み込まれているか
- 対象列で文字変換が実行されているか
- 警告やエラーが適切に処理されているか
- 出力ファイルが正しく生成されているか

**トラブル時の対処**:
- `conversionTable`のパスが正しいか確認
- 変換表ファイルが実際に生成されているか確認
- ログで詳細なエラー情報を確認（`--verbose`オプション使用）

### 4. 更新時の注意点

- **バックアップ**: 既存の変換表をバックアップ
- **段階的テスト**: 小規模データで動作確認後、本格運用
- **ログ確認**: 変換結果を詳細ログで検証
- **文字エンコーディング**: 変換表のエンコーディングを入力ファイルと合わせる

## トラブルシューティング

### セットアップ時のよくある問題

| 問題 | 原因 | 対処法 |
|------|------|--------|
| `node`コマンドが認識されない | Node.jsがインストールされていない | Node.jsの再インストール、環境変数PATH確認 |
| `npm install`が途中で止まる | ネットワークまたはキャッシュの問題 | `npm cache clean --force` 後に再実行 |
| ビルドエラー | 依存関係の問題 | `node_modules`を削除して`npm install`を再実行 |

### 実行時のよくあるエラー

| 問題 | 原因 | 対処法 |
|------|------|--------|
| ファイルが見つからない | パスが間違っている | 設定ファイルのパスを確認、相対パスから絶対パスに変更 |
| 文字化け | 入力ファイルと設定の文字エンコーディング不一致、出力ファイルの文字エンコーディングで扱えない文字が含まれる | 設定でエンコーディングを調整（utf8, shift_jis等） |
| 変換表読み込みエラー | CSV形式が不正 | 変換表の形式を確認、BOMの有無をチェック |
| メモリ不足 | 大容量ファイル処理 | ファイルを分割して処理、またはメモリを増設 |

### コマンドプロンプトでよくある問題

| 問題 | 原因 | 対処法 |
|------|------|--------|
| フォルダが見つからない | 現在のディレクトリが不明、パス間違い | `dir`コマンドで現在のフォルダ内容を確認、正しいパスに移動 |
| パスの区切り文字エラー | OSによる区切り文字の違い | Windows: `\` を使用（例: `C:\projects\mj-converter-cli-main`） |
| 権限エラー | 管理者権限が必要な操作 | コマンドプロンプトを「管理者として実行」 |
| コマンドが認識されない | 環境変数PATHの問題 | Node.jsが正しくインストールされているか確認、再起動 |
