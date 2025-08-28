#!/usr/bin/env node

import { main } from './cli.js';

// プロセス終了時の処理
process.on('uncaughtException', (error) => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未処理のPromise拒否:', reason);
  process.exit(1);
});

// メイン処理の実行
async function run() {
  try {
    const exitCode = await main();
    // ログの書き込み完了を待つ
    setTimeout(() => process.exit(exitCode), 100);
  } catch (error) {
    console.error('メイン処理でエラーが発生しました:', error);
    setTimeout(() => process.exit(1), 100);
  }
}

run();