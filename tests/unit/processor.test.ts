import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processConversion } from "../../src/processor.js";
import type { ConversionConfig } from "../../src/types/config.js";

// 依存モジュールをモック化
vi.mock("../../src/utils/csv.js", () => ({
	readCsv: vi.fn(),
	writeCsv: vi.fn(),
}));

vi.mock("../../src/utils/converter.js", () => ({
	loadConversionTable: vi.fn(),
	convertCsvRecord: vi.fn(),
}));

vi.mock("../../src/utils/logger.js", () => ({
	getLogger: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
}));

import {
	convertCsvRecord,
	loadConversionTable,
} from "../../src/utils/converter.js";
// モック関数をインポート
import { readCsv, writeCsv } from "../../src/utils/csv.js";

describe("processor.js", () => {
	const mockConfig: ConversionConfig = {
		input: {
			path: "input.csv",
			encoding: "utf8",
			lineBreak: "lf",
			quote: '"',
			hasHeader: true,
		},
		output: {
			path: "output.csv",
			encoding: "utf8",
			lineBreak: "lf",
			quote: '"',
			hasHeader: true,
		},
		conversionTable: "conversion.csv",
		targetColumns: [1, 2],
		missingCharacterHandling: "warn",
	};

	const mockConversionMap = new Map([
		["龍", "龙"],
		["鳳", "凤"],
		["車", "车"],
	]);

	const mockInputRecords = [
		["ID", "Name", "Description"],
		["1", "龍王", "古老的龍王"],
		["2", "鳳凰", "美麗的鳳凰車"],
	];

	beforeEach(() => {
		vi.resetAllMocks();

		// デフォルトのモック実装を設定
		vi.mocked(loadConversionTable).mockResolvedValue(mockConversionMap);
		vi.mocked(readCsv).mockResolvedValue(mockInputRecords);
		vi.mocked(writeCsv).mockResolvedValue();
		vi.mocked(convertCsvRecord).mockImplementation((record, targetColumns) => ({
			record: [...record], // 簡単な実装でそのまま返す
			hasWarnings: false,
		}));
	});

	describe("processConversion", () => {
		it("正常な処理が成功する", async () => {
			// 変換結果をモック
			vi.mocked(convertCsvRecord).mockImplementation((record) => ({
				record: record.map((cell, index) =>
					index === 1
						? cell.replace("龍", "龙")
						: index === 2
							? cell.replace("龍", "龙").replace("鳳", "凤").replace("車", "车")
							: cell,
				),
				hasWarnings: false,
			}));

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);
			expect(result.processedRows).toBe(2); // ヘッダーを除いた2行
			expect(result.hasWarnings).toBe(false);

			// 各関数が適切に呼ばれることを確認
			expect(loadConversionTable).toHaveBeenCalledWith("conversion.csv");
			expect(readCsv).toHaveBeenCalledWith(mockConfig.input);
			expect(writeCsv).toHaveBeenCalled();
			expect(convertCsvRecord).toHaveBeenCalledTimes(2); // データ行の数
		});

		it("警告がある場合の処理", async () => {
			// 警告が発生する変換結果をモック
			vi.mocked(convertCsvRecord).mockImplementation(() => ({
				record: ["1", "龙王", "古老的龙王"],
				hasWarnings: true,
			}));

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);
			expect(result.hasWarnings).toBe(true);
		});

		it("空の入力ファイルの処理", async () => {
			vi.mocked(readCsv).mockResolvedValue([]);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);
			expect(result.processedRows).toBe(0);
			expect(result.hasWarnings).toBe(true);

			// CSV書き込みは呼ばれない
			expect(writeCsv).not.toHaveBeenCalled();
		});

		it("ヘッダーなしの入力ファイルの処理", async () => {
			const configNoHeader = {
				...mockConfig,
				input: { ...mockConfig.input, hasHeader: false },
				output: { ...mockConfig.output, hasHeader: false },
			};

			const inputNoHeader = [
				["1", "龍王", "古老的龍王"],
				["2", "鳳凰", "美麗的鳳凰車"],
			];

			vi.mocked(readCsv).mockResolvedValue(inputNoHeader);

			const result = await processConversion(configNoHeader);

			expect(result.success).toBe(true);
			expect(result.processedRows).toBe(2); // 全行がデータ行
			expect(convertCsvRecord).toHaveBeenCalledTimes(2);
		});

		it("出力にヘッダーありの処理", async () => {
			vi.mocked(convertCsvRecord).mockImplementation((record) => ({
				record: [...record],
				hasWarnings: false,
			}));

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);

			// writeCsvが呼ばれ、ヘッダー行を含んでいることを確認
			const writeCsvCall = vi.mocked(writeCsv).mock.calls[0];
			const outputData = writeCsvCall[0];
			expect(outputData[0]).toEqual(["ID", "Name", "Description"]); // ヘッダー行
			expect(outputData.length).toBe(3); // ヘッダー + 2データ行
		});

		it("変換表読み込みエラーの処理", async () => {
			vi.mocked(loadConversionTable).mockRejectedValue(
				new Error("変換表ファイルが見つかりません"),
			);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toContain("変換表ファイルが見つかりません");
		});

		it("CSV読み込みエラーの処理", async () => {
			vi.mocked(readCsv).mockRejectedValue(
				new Error("CSVファイルが見つかりません"),
			);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toContain("CSVファイルが見つかりません");
		});

		it("CSV書き込みエラーの処理", async () => {
			vi.mocked(writeCsv).mockRejectedValue(
				new Error("書き込み権限がありません"),
			);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toContain("書き込み権限がありません");
		});

		it("変換処理エラー（errorモード）の処理", async () => {
			vi.mocked(convertCsvRecord).mockImplementation(() => {
				throw new Error("変換表に文字が見つかりません");
			});

			const errorConfig = {
				...mockConfig,
				missingCharacterHandling: "error" as const,
			};

			const result = await processConversion(errorConfig);

			expect(result.success).toBe(false);
			expect(result.errorMessage).toContain("変換表に文字が見つかりません");
		});

		it("大量データの処理進捗ログ", async () => {
			// 1001行のデータを作成（ヘッダー + 1000行）
			const largeInputRecords = [
				["ID", "Name", "Description"],
				...Array.from({ length: 1000 }, (_, i) => [
					`${i + 1}`,
					"龍王",
					"古老的龍王",
				]),
			];

			vi.mocked(readCsv).mockResolvedValue(largeInputRecords);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);
			expect(result.processedRows).toBe(1000);
			expect(convertCsvRecord).toHaveBeenCalledTimes(1000);
		});

		it("列数不足の警告処理", async () => {
			// 列数が足りない行を含む入力
			const shortColumnRecords = [
				["ID", "Name", "Description"],
				["1", "龍王"], // 列が足りない
				["2", "鳳凰", "美麗的鳳凰車"],
			];

			vi.mocked(readCsv).mockResolvedValue(shortColumnRecords);

			const result = await processConversion(mockConfig);

			expect(result.success).toBe(true);
			// 実際の実装では警告ログが出力される（テストではモック化されているため直接確認できない）
		});
	});
});
