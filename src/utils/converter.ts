import type { FileConfig } from "../types/config.js";
import { readCsv } from "./csv.js";
import { getLogger } from "./logger.js";
import { joinCharacters, splitCharacters } from "./unicode.js";

/**
 * 文字変換表のマッピング
 */
export type ConversionMap = Map<string, string>;

/**
 * CSV形式の文字変換表を読み込んでMapオブジェクトを作成
 * CSVフォーマット: 変換前文字,変換後文字
 */
export async function loadConversionTable(
	filePath: string,
): Promise<ConversionMap> {
	const logger = getLogger();

	try {
		logger.info(`文字変換表を読み込み中: ${filePath}`);

		const tableConfig: FileConfig = {
			path: filePath,
			encoding: "utf8",
			lineBreak: "lf",
			quote: '"',
			hasHeader: false,
		};

		const records = await readCsv(tableConfig);
		const conversionMap = new Map<string, string>();

		let validCount = 0;
		let errorCount = 0;

		for (let i = 0; i < records.length; i++) {
			const record = records[i];

			if (!record || record.length < 2) {
				logger.warn(
					`行${i + 1}: 変換表の形式が正しくありません (列数: ${record?.length || 0})`,
				);
				errorCount++;
				continue;
			}

			const fromChar = record[0]?.trim();
			const toChar = record[1]?.trim();

			if (!fromChar) {
				logger.warn(`行${i + 1}: 変換前文字が空です`);
				errorCount++;
				continue;
			}

			// 変換後文字が空の場合は削除を意味する
			conversionMap.set(fromChar, toChar || "");
			validCount++;
		}

		logger.info(
			`文字変換表読み込み完了: 有効${validCount}件, エラー${errorCount}件`,
		);

		if (validCount === 0) {
			throw new Error("有効な変換ルールが見つかりません");
		}

		return conversionMap;
	} catch (error) {
		logger.error(
			`文字変換表読み込みエラー: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

/**
 * 文字列を変換表に基づいて1文字ずつ変換
 */
export function convertString(
	text: string,
	conversionMap: ConversionMap,
): string {
	const chars = splitCharacters(text);
	const convertedChars: string[] = [];

	for (const char of chars) {
		const converted = conversionMap.get(char);
		if (converted !== undefined) {
			// 変換ルールがある場合（空文字の場合は削除）
			if (converted !== "") {
				convertedChars.push(converted);
			}
		} else {
			// 変換ルールがない場合はそのまま
			convertedChars.push(char);
		}
	}

	return joinCharacters(convertedChars);
}

export interface ConvertCsvRecordResult {
	record: string[];
	hasWarnings: boolean;
}

export interface ConvertStringResult {
	convertedValue: string;
	hasWarnings: boolean;
}

/**
 * 文字列を変換表に基づいて1文字ずつ変換
 */
export function convertStringWithHandling(
	text: string,
	conversionMap: ConversionMap,
	missingCharacterHandling: "error" | "skip" | "warn",
): ConvertStringResult {
	const chars = splitCharacters(text);
	const convertedChars: string[] = [];
	let hasWarnings = false;
	const logger = getLogger();

	for (const char of chars) {
		const converted = conversionMap.get(char);
		if (converted !== undefined) {
			// 変換ルールがある場合（空文字の場合は削除）
			if (converted !== "") {
				convertedChars.push(converted);
			}
		} else {
			// 変換ルールがない場合の処理
			switch (missingCharacterHandling) {
				case "error":
					throw new Error(`文字変換表に文字 "${char}" が見つかりません`);
				case "warn":
					logger.warn(
						`【文字変換警告】文字 "${char}" (U+${char.codePointAt(0)?.toString(16).padStart(4, "0")}) が変換表に見つかりません。そのまま出力します。`,
					);
					convertedChars.push(char);
					hasWarnings = true;
					break;
				default:
					convertedChars.push(char);
					break;
			}
		}
	}

	return {
		convertedValue: joinCharacters(convertedChars),
		hasWarnings,
	};
}

/**
 * CSVの指定列のみを文字変換
 */
export function convertCsvRecord(
	record: string[],
	targetColumns: number[],
	conversionMap: ConversionMap,
	missingCharacterHandling: "error" | "skip" | "warn",
): ConvertCsvRecordResult {
	const logger = getLogger();
	const convertedRecord = [...record];
	let hasWarnings = false;

	for (const columnIndex of targetColumns) {
		if (columnIndex >= 0 && columnIndex < record.length) {
			const originalValue = record[columnIndex] || "";
			const result = convertStringWithHandling(
				originalValue,
				conversionMap,
				missingCharacterHandling,
			);
			convertedRecord[columnIndex] = result.convertedValue;

			if (result.hasWarnings) {
				hasWarnings = true;
			}

			if (originalValue !== result.convertedValue) {
				logger.debug(
					`列${columnIndex + 1}: "${originalValue}" → "${result.convertedValue}"`,
				);
			}
		} else {
			logger.warn(
				`列インデックス ${columnIndex} は範囲外です (最大: ${record.length - 1})`,
			);
			hasWarnings = true;
		}
	}

	return {
		record: convertedRecord,
		hasWarnings,
	};
}
