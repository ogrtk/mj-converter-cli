@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: CSV文字変換CLIツール実行スクリプト
:: 使用方法: run.bat [設定ファイルパス] [--input 入力ファイル] [--output 出力ファイル] [--batch]

:: パラメータ解析
set CONFIG_FILE=config.json
set BATCH_MODE=0
set INPUT_FILE=
set OUTPUT_FILE=

:parse_args
if "%~1"=="" goto args_done
if "%~1"=="--batch" (
    set BATCH_MODE=1
    shift
    goto parse_args
)
if "%~1"=="--input" (
    shift
    set INPUT_FILE=%~1
    shift
    goto parse_args
)
if "%~1"=="--output" (
    shift
    set OUTPUT_FILE=%~1
    shift
    goto parse_args
)
:: 最初のパラメータが--で始まらない場合は設定ファイルとして扱う
if "%~1:~0,2%" neq "--" (
    set CONFIG_FILE=%~1
)
shift
goto parse_args

:args_done

:: パラメータ情報表示
echo 設定ファイル: !CONFIG_FILE!
if not "!INPUT_FILE!"=="" echo 入力ファイルを上書き: !INPUT_FILE!
if not "!OUTPUT_FILE!"=="" echo 出力ファイルを上書き: !OUTPUT_FILE!

:: 設定ファイルの存在チェック
if not exist "!CONFIG_FILE!" (
    echo エラー: 設定ファイル '!CONFIG_FILE!' が見つかりません。
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: Node.jsの存在チェック
where node >nul 2>&1
if errorlevel 1 (
    echo エラー: Node.jsがインストールされていません。
    echo https://nodejs.org/ からダウンロードしてインストールしてください。
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: package.jsonの存在チェック
if not exist "package.json" (
    echo エラー: package.jsonが見つかりません。正しいディレクトリで実行してください。
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: 依存関係のインストール確認
if not exist "node_modules" (
    echo 依存関係をインストール中...
    call npm install
    if errorlevel 1 (
        echo エラー: 依存関係のインストールに失敗しました。
        if %BATCH_MODE% equ 0 pause
        exit /b 1
    )
)

:: ビルド済みファイルの確認
if not exist "dist\cli.js" (
    echo ビルドファイルが見つかりません。ビルドを実行中...
    call npm run build
    if errorlevel 1 (
        echo エラー: ビルドに失敗しました。
        if %BATCH_MODE% equ 0 pause
        exit /b 1
    )
)

:: CSV変換ツールの実行
echo CSV文字変換ツールを実行中...

:: コマンドライン引数を構築
set CLI_ARGS=--config "!CONFIG_FILE!"
if not "!INPUT_FILE!"=="" (
    set CLI_ARGS=!CLI_ARGS! --input "!INPUT_FILE!"
)
if not "!OUTPUT_FILE!"=="" (
    set CLI_ARGS=!CLI_ARGS! --output "!OUTPUT_FILE!"
)

node dist\cli.js !CLI_ARGS!
set TOOL_EXIT_CODE=%errorlevel%

if %TOOL_EXIT_CODE% equ 0 (
    echo CSV変換処理が完了しました。
) else if %TOOL_EXIT_CODE% equ 2 (
    echo 警告: CSV変換処理は完了しましたが、警告が発生しました。ログを確認してください。
    if %BATCH_MODE% equ 0 pause
    exit /b 2
) else (
    echo エラー: CSV変換処理に失敗しました。
    if %BATCH_MODE% equ 0 pause
    exit /b %TOOL_EXIT_CODE%
)

endlocal