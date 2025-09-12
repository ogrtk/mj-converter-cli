import * as fs from "node:fs";
import * as path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { processConversion } from "./processor.js";
import type { AppConfig } from "./types/config.js";
import { initLogger } from "./utils/logger.js";

/**
 * 設定ファイルを読み込み、バリデーションを行う
 * コマンドライン引数で指定されたファイルパスで設定を上書きする
 */
function loadConfig(configPath: string, inputPath?: string, outputPath?: string): AppConfig {
	if (!fs.existsSync(configPath)) {
		throw new Error(`設定ファイルが見つかりません: ${configPath}`);
	}

	try {
		const configContent = fs.readFileSync(configPath, "utf8");
		const config = JSON.parse(configContent) as AppConfig;

		// 基本的なバリデーション
		if (!config.conversion) {
			throw new Error("設定ファイルに conversion セクションがありません");
		}

		if (!config.conversion.input?.path && !inputPath) {
			throw new Error("入力ファイルパスが設定されていません（設定ファイルまたは--inputパラメータで指定してください）");
		}

		if (!config.conversion.output?.path && !outputPath) {
			throw new Error("出力ファイルパスが設定されていません（設定ファイルまたは--outputパラメータで指定してください）");
		}

		if (!config.conversion.conversionTable) {
			throw new Error("文字変換表パスが設定されていません");
		}

		if (
			!Array.isArray(config.conversion.targetColumns) ||
			config.conversion.targetColumns.length === 0
		) {
			throw new Error("対象列が設定されていません");
		}

		// hasHeaderのデフォルト値設定
		if (config.conversion.input.hasHeader === undefined) {
			config.conversion.input.hasHeader = false;
		}
		if (config.conversion.output.hasHeader === undefined) {
			config.conversion.output.hasHeader = false;
		}

		// ヘッダーの整合性チェック
		if (
			!config.conversion.input.hasHeader &&
			config.conversion.output.hasHeader
		) {
			throw new Error(
				"入力ファイルにヘッダーがないのに、出力ファイルにヘッダーを出力することはできません",
			);
		}

		// missingCharacterHandlingのデフォルト値設定
		if (!config.conversion.missingCharacterHandling) {
			config.conversion.missingCharacterHandling = "skip";
		}

		// デフォルト値の設定
		if (!config.logging) {
			config.logging = {
				level: "info",
				output: "file",
			};
		}

		// コマンドライン引数でファイルパスを上書き
		if (inputPath) {
			config.conversion.input.path = inputPath;
		}
		if (outputPath) {
			config.conversion.output.path = outputPath;
		}

		return config;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(`設定ファイルのJSONが正しくありません: ${error.message}`);
		}
		throw error;
	}
}

/**
 * CLIのメイン処理
 */
export async function main(): Promise<number> {
	try {
		const argv = await yargs(hideBin(process.argv))
			.option("config", {
				alias: "c",
				type: "string",
				demandOption: true,
				describe: "JSON設定ファイルのパス",
				default: "config.json",
			})
			.option("input", {
				alias: "i",
				type: "string",
				describe: "入力CSVファイルのパス（設定ファイルの値を上書き）",
			})
			.option("output", {
				alias: "o",
				type: "string",
				describe: "出力CSVファイルのパス（設定ファイルの値を上書き）",
			})
			.option("verbose", {
				alias: "v",
				type: "boolean",
				describe: "デバッグログを出力",
				default: false,
			})
			.help().argv;

		// 設定ファイル読み込み
		const config = loadConfig(argv.config, argv.input, argv.output);

		// verboseオプションが指定された場合はログレベルを変更
		if (argv.verbose) {
			config.logging.level = "debug";
		}

		// ロガー初期化
		const logger = initLogger(config.logging);
		logger.info("CSV文字変換CLIツールを開始します");
		logger.info(`設定ファイル: ${path.resolve(argv.config)}`);
		
		// ファイルパスの上書き情報をログ出力
		if (argv.input) {
			logger.info(`入力ファイルパスをパラメータで上書き: ${argv.input}`);
		}
		if (argv.output) {
			logger.info(`出力ファイルパスをパラメータで上書き: ${argv.output}`);
		}

		// 入力ファイルの存在チェック
		if (!fs.existsSync(config.conversion.input.path)) {
			logger.error(
				`入力ファイルが見つかりません: ${config.conversion.input.path}`,
			);
			return 1;
		}

		// 文字変換表の存在チェック
		if (!fs.existsSync(config.conversion.conversionTable)) {
			logger.error(
				`文字変換表ファイルが見つかりません: ${config.conversion.conversionTable}`,
			);
			return 1;
		}

		// 出力ディレクトリの作成
		const outputDir = config.conversion.output.path.substring(
			0,
			config.conversion.output.path.lastIndexOf("/"),
		);
		if (outputDir && !fs.existsSync(outputDir)) {
			logger.info(`出力ディレクトリを作成します: ${outputDir}`);
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// 文字変換処理実行
		const result = await processConversion(config.conversion);

		if (result.success) {
			logger.info(
				`処理が正常に完了しました。処理行数: ${result.processedRows}行`,
			);
			if (result.hasWarnings) {
				logger.warn(
					"処理中に警告が発生しました。詳細はログファイルを確認してください。",
				);
				return 2; // 警告終了コード
			}
			return 0; // 正常終了
		}
		logger.error(`処理に失敗しました: ${result.errorMessage}`);
		return 1; // エラー終了
	} catch (error) {
		console.error(
			`エラー: ${error instanceof Error ? error.message : String(error)}`,
		);
		return 1;
	}
}
