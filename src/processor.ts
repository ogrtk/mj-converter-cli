import * as path from "node:path";
import type { ConversionConfig } from "./types/config.js";
import { validateEncoding } from "./utils/character-set.js";
import {
	convertCsvRecord,
	loadConversionTable,
} from "./utils/converter.js";
import { readCsv, writeCsv } from "./utils/csv.js";
import { getLogger } from "./utils/logger.js";

export interface ProcessResult {
	success: boolean;
	processedRows: number;
	errorMessage?: string;
	hasWarnings?: boolean;
}

/**
 * CSV文字変換の主要処理
 */
export async function processConversion(
	config: ConversionConfig,
): Promise<ProcessResult> {
	const logger = getLogger();

	try {
		logger.info("=".repeat(60));
		logger.info("CSV文字変換処理を開始します");
		logger.info(`処理開始時刻: ${new Date().toISOString()}`);
		logger.info("=".repeat(60));
		logger.info(`入力ファイルパス: ${path.resolve(config.input.path)}`);
		logger.info(`出力ファイルパス: ${path.resolve(config.output.path)}`);
		logger.info(`変換表ファイルパス: ${path.resolve(config.conversionTable)}`);
		logger.info(`対象列番号: [${config.targetColumns.join(", ")}] (0から開始)`);
		logger.info(`入力ファイルエンコーディング: ${config.input.encoding}`);
		logger.info(`出力ファイルエンコーディング: ${config.output.encoding}`);
		logger.info(
			`入力ファイルヘッダー: ${config.input.hasHeader ? "あり" : "なし"}`,
		);
		logger.info(
			`出力ファイルヘッダー: ${config.output.hasHeader ? "あり" : "なし"}`,
		);
		logger.info(
			`文字変換表にない文字の処理方式: ${config.missingCharacterHandling}`,
		);
		logger.info("-".repeat(60));

		// 文字変換表を読み込み
		const conversionMap = await loadConversionTable(config.conversionTable);
		logger.info(`変換ルール数: ${conversionMap.size}件`);

		// 文字エンコーディング検証（設定されている場合）
		if (config.characterSetValidation?.enabled) {
			if (!validateEncoding(config.characterSetValidation.targetEncoding)) {
				throw new Error(
					`サポートされていないエンコーディング: ${config.characterSetValidation.targetEncoding}`,
				);
			}
			logger.info(
				`文字エンコーディング検証を有効化: ${config.characterSetValidation.targetEncoding}`,
			);
			logger.info(
				`未定義文字の処理方式: ${config.characterSetValidation.undefinedCharacterHandling}`,
			);
		}

		// 入力CSVファイルを読み込み
		logger.info("入力CSVファイルを読み込み中...");
		const inputRecords = await readCsv(config.input);
		logger.info(`入力ファイル読み込み完了: 合計${inputRecords.length}行`);

		if (inputRecords.length === 0) {
			logger.warn("【警告】入力ファイルが空です");
			logger.info("処理を終了します");
			return { success: true, processedRows: 0, hasWarnings: true };
		}

		// 各行の列数チェック
		const expectedColumns = Math.max(...config.targetColumns) + 1;
		for (let i = 0; i < Math.min(inputRecords.length, 5); i++) {
			const record = inputRecords[i];
			if (record && record.length < expectedColumns) {
				logger.warn(
					`【警告】行${i + 1}: 列数不足 (実際:${record.length}, 必要:${expectedColumns})`,
				);
			}
		}

		// データ処理
		const outputRecords: string[][] = [];
		let processedDataRows = 0;
		let startRowIndex = 0;
		let hasWarnings = false;

		// 入力ファイルのヘッダー行処理
		let headerRecord: string[] | undefined;
		if (config.input.hasHeader && inputRecords.length > 0) {
			headerRecord = inputRecords[0];
			startRowIndex = 1;
			logger.info(
				`入力ファイルのヘッダー行を検出: [${headerRecord?.join(", ")}]`,
			);
		} else {
			logger.info("入力ファイルにヘッダー行はありません");
		}

		// 出力ファイルのヘッダー行処理
		if (config.output.hasHeader) {
			if (headerRecord) {
				outputRecords.push(headerRecord); // 入力のヘッダーをそのまま出力
				logger.info("ヘッダー行を出力ファイルに含めます");
			} else {
				logger.warn(
					"【警告】出力にヘッダーが必要ですが、入力ファイルにヘッダーがありません",
				);
				hasWarnings = true;
			}
		} else {
			logger.info("出力ファイルにヘッダー行は含めません");
		}

		const dataRowCount = inputRecords.length - startRowIndex;
		logger.info(
			`処理対象データ行数: ${dataRowCount}行 (${startRowIndex + 1}行目～${inputRecords.length}行目)`,
		);
		logger.info("-".repeat(60));

		// データ行を1行ずつ処理
		for (let i = startRowIndex; i < inputRecords.length; i++) {
			const record = inputRecords[i];
			if (!record) continue;

			try {
				const result = convertCsvRecord(
					record,
					config.targetColumns,
					conversionMap,
					config.missingCharacterHandling,
					config.characterSetValidation,
				);
				outputRecords.push(result.record);
				if (result.hasWarnings) {
					hasWarnings = true;
				}
				processedDataRows++;

				if (processedDataRows % 1000 === 0) {
					logger.info(`処理中... ${processedDataRows}行完了`);
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				logger.error(`行${i + 1}の処理でエラー: ${errorMessage}`);

				// 文字エンコーディング検証のエラーの場合は、undefinedCharacterHandlingが"error"なら停止
				if (
					config.characterSetValidation?.enabled &&
					config.characterSetValidation.undefinedCharacterHandling ===
						"error" &&
					errorMessage.includes("に含まれません")
				) {
					throw error;
				}

				// 変換ルール関連のエラーの場合は、missingCharacterHandlingが"error"なら停止
				if (config.missingCharacterHandling === "error") {
					throw error;
				}

				// その他のエラーは警告として処理継続
				outputRecords.push(record);
				hasWarnings = true;
			}
		}

		logger.info("-".repeat(60));
		logger.info(`データ行処理完了: 全${processedDataRows}行を処理`);

		// 出力CSVファイルに書き込み
		logger.info("出力CSVファイルに書き込み中...");
		await writeCsv(outputRecords, config.output);
		logger.info(`出力ファイル書き込み完了: ${outputRecords.length}行出力`);

		// 最終結果の詳細レポート
		logger.info("=".repeat(60));
		logger.info("【処理結果レポート】");
		logger.info(`処理完了時刻: ${new Date().toISOString()}`);
		logger.info(`処理ステータス: ${hasWarnings ? "警告あり" : "正常完了"}`);
		logger.info(
			`入力ファイル: ${path.resolve(config.input.path)} (${inputRecords.length}行)`,
		);
		logger.info(
			`出力ファイル: ${path.resolve(config.output.path)} (${outputRecords.length}行)`,
		);
		logger.info(`処理データ行数: ${processedDataRows}行`);
		logger.info(`文字変換ルール適用数: ${conversionMap.size}件`);
		logger.info(`対象列: [${config.targetColumns.join(", ")}]`);

		if (hasWarnings) {
			logger.warn(
				"⚠️  処理中に警告が発生しました。上記ログの詳細を確認してください。",
			);
		} else {
			logger.info("✅ CSV文字変換処理が正常に完了しました");
		}
		logger.info("=".repeat(60));

		return {
			success: true,
			processedRows: processedDataRows,
			hasWarnings,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(`CSV文字変換処理でエラーが発生しました: ${errorMessage}`);

		return {
			success: false,
			processedRows: 0,
			errorMessage,
		};
	}
}
