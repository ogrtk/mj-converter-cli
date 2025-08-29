@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: CSV文字変換CLIツール実行スクリプト
:: 使用方法: run.bat [設定ファイルパス]

if "%~1"=="" (
    set CONFIG_FILE=config.json
) else (
    set CONFIG_FILE=%~1
)

:: 設定ファイルの存在チェック
if not exist "!CONFIG_FILE!" (
    echo エラー: 設定ファイル '!CONFIG_FILE!' が見つかりません。
    exit /b 1
)

:: Node.jsの存在チェック
where node >nul 2>&1
if errorlevel 1 (
    echo エラー: Node.jsがインストールされていません。
    echo https://nodejs.org/ からダウンロードしてインストールしてください。
    exit /b 1
)

:: package.jsonの存在チェック
if not exist "package.json" (
    echo エラー: package.jsonが見つかりません。正しいディレクトリで実行してください。
    exit /b 1
)

:: 依存関係のインストール確認
if not exist "node_modules" (
    echo 依存関係をインストール中...
    call npm install
    if errorlevel 1 (
        echo エラー: 依存関係のインストールに失敗しました。
        exit /b 1
    )
)

:: ビルド済みファイルの確認
if not exist "dist\cli.js" (
    echo ビルドファイルが見つかりません。ビルドを実行中...
    call npm run build
    if errorlevel 1 (
        echo エラー: ビルドに失敗しました。
        exit /b 1
    )
)

:: CSV変換ツールの実行
echo CSV文字変換ツールを実行中...
node dist\cli.js --config "!CONFIG_FILE!"
set TOOL_EXIT_CODE=%errorlevel%

if %TOOL_EXIT_CODE% equ 0 (
    echo CSV変換処理が完了しました。
) else if %TOOL_EXIT_CODE% equ 2 (
    echo 警告: CSV変換処理は完了しましたが、警告が発生しました。ログを確認してください。
    exit /b 2
) else (
    echo エラー: CSV変換処理に失敗しました。
    exit /b %TOOL_EXIT_CODE%
)

endlocal