import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import type { AppConfig } from '../types/config.js';

let logger: winston.Logger;

/**
 * ロガーを初期化
 */
export function initLogger(config: AppConfig['logging']): winston.Logger {
  const transports: winston.transport[] = [];
  
  // コンソール出力
  if (config.output === 'console') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        })
      )
    }));
  }
  
  // ファイル出力（デフォルト）
  if (config.output === 'file' || config.output === 'console') {
    // logsディレクトリを作成
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // ログファイル名の決定
    const logFile = config.logFile || path.join(logsDir, `csv-converter-${new Date().toISOString().split('T')[0]}.log`);
    
    transports.push(new winston.transports.File({
      filename: logFile,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        })
      )
    }));
    
    // ファイルパスをコンソールに表示（初回のみ）
    console.log(`ログファイル: ${path.resolve(logFile)}`);
  }
  
  logger = winston.createLogger({
    level: config.level,
    transports,
    exitOnError: false
  });
  
  // ログファイルへの書き込みを確実にするためのテスト
  if (transports.some(t => t instanceof winston.transports.File)) {
    logger.info('ログシステム初期化完了');
  }
  
  return logger;
}

/**
 * 初期化済みのロガーを取得
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return logger;
}