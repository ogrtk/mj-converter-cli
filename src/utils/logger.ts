import * as fs from "node:fs";
import * as path from "node:path";
import winston from "winston";
import type { AppConfig } from "../types/config.js";

let logger: winston.Logger;

/**
 * ロガーを初期化
 */
export function initLogger(config: AppConfig["logging"]): winston.Logger {
	const transports: winston.transport[] = [];

	// コンソール出力
	if (config.output === "console") {
		transports.push(
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
					winston.format.printf(({ timestamp, level, message }) => {
						return `${timestamp} [${level}] ${message}`;
					}),
				),
			}),
		);
	}

	// ファイル出力（デフォルト）
	if (config.output === "file" || config.output === "console") {
		// logsディレクトリを作成
		const logsDir = "logs";
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}

		// 直近のログファイルを探し、10MB未満であれば使用、そうでなければ新規作成
		const maxSize = 10 * 1024 * 1024; // 10MB
		let logFilename = "";

		const existingFiles = fs
			.readdirSync(logsDir)
			.filter((file) =>
				file.match(/^csv-converter-\d{4}-\d{2}-\d{2}-\d{6}\.log$/),
			)
			.sort()
			.reverse(); // 新しい順にソート

		if (existingFiles.length > 0 && existingFiles[0]) {
			const latestFile = path.join(logsDir, existingFiles[0]);
			const stats = fs.statSync(latestFile);
			if (stats.size < maxSize) {
				logFilename = latestFile;
			}
		}

		// 新しいファイル名を生成（直近ファイルが10MB以上または存在しない場合）
		if (!logFilename) {
			const timestamp = new Date()
				.toISOString()
				.replace(/:/g, "")
				.replace(/\./g, "")
				.replace("T", "-")
				.slice(0, 17);
			logFilename = path.join(logsDir, `csv-converter-${timestamp}.log`);
		}

		transports.push(
			new winston.transports.File({
				filename: logFilename,
				maxsize: maxSize,
				maxFiles: 5,
				format: winston.format.combine(
					winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
					winston.format.printf(({ timestamp, level, message }) => {
						return `${timestamp} [${level}] ${message}`;
					}),
				),
			}),
		);

		console.log(`ログファイル: ${path.resolve(logFilename)}`);
	}

	logger = winston.createLogger({
		level: config.level,
		transports,
		exitOnError: false,
	});

	// ログファイルへの書き込みを確実にするためのテスト
	if (transports.some((t) => t instanceof winston.transports.File)) {
		logger.info("ログシステム初期化完了");
	}

	return logger;
}

/**
 * 初期化済みのロガーを取得
 */
export function getLogger(): winston.Logger {
	if (!logger) {
		throw new Error("Logger not initialized. Call initLogger() first.");
	}
	return logger;
}
