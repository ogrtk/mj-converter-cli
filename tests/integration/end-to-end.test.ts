import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { processConversion } from "../../src/processor.js";
import type { ConversionConfig } from "../../src/types/config.js";

// ログをモック化してテスト出力をクリーンに保つ
import { vi } from "vitest";
vi.mock("../../src/utils/logger.js", () => ({
	initLogger: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
	getLogger: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
}));

describe("エンドツーエンド統合テスト", () => {
	const testDir = path.join(process.cwd(), "tests/fixtures/integration");
	const inputPath = path.join(testDir, "integration-input.csv");
	const outputPath = path.join(testDir, "integration-output.csv");
	const conversionPath = path.join(testDir, "integration-conversion.csv");

	beforeEach(() => {
		// テスト用ディレクトリを作成
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}

		// テスト用変換表を作成
		const conversionData = ["龍,龙", "鳳,凤", "車,车", "馬,马", "雞,鸡"].join(
			"\n",
		);
		fs.writeFileSync(conversionPath, conversionData, "utf8");

		// テスト用入力CSVを作成
		const inputData = [
			"ID,Name,Description",
			"1,龍王,古老的龍王統治著東海",
			"2,鳳凰,美麗的鳳凰在天空中飛舞",
			"3,馬車,快速的馬車在道路上奔馳",
			"4,雞群,一群雞在農場裡覓食",
		].join("\n");
		fs.writeFileSync(inputPath, inputData, "utf8");
	});

	afterEach(() => {
		// テストファイルをクリーンアップ
		try {
			if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
			if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
			if (fs.existsSync(conversionPath)) fs.unlinkSync(conversionPath);
			if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
		} catch (error) {
			// クリーンアップエラーは無視
		}
	});

	it("完全な文字変換処理が正常に動作する", async () => {
		const config: ConversionConfig = {
			input: {
				path: inputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionPath,
			targetColumns: [1, 2], // Name と Description 列を変換
			missingCharacterHandling: "warn",
		};

		const result = await processConversion(config);

		// 処理結果を確認
		expect(result.success).toBe(true);
		expect(result.processedRows).toBe(4); // データ行数

		// 出力ファイルが作成されていることを確認
		expect(fs.existsSync(outputPath)).toBe(true);

		// 出力ファイルの内容を確認
		const outputContent = fs.readFileSync(outputPath, "utf8");
		const outputLines = outputContent.trim().split("\n");

		// ヘッダー行の確認
		expect(outputLines[0]).toContain("ID");
		expect(outputLines[0]).toContain("Name");
		expect(outputLines[0]).toContain("Description");

		// 変換された内容の確認
		expect(outputContent).toContain("龙王"); // 龍 → 龙
		expect(outputContent).toContain("凤凰"); // 鳳 → 凤
		expect(outputContent).toContain("车"); // 車 → 车
		expect(outputContent).toContain("马"); // 馬 → 马
		expect(outputContent).toContain("鸡"); // 雞 → 鸡

		// 元の繁体字がないことを確認
		expect(outputContent).not.toContain("龍");
		expect(outputContent).not.toContain("鳳");
		expect(outputContent).not.toContain("車");
		expect(outputContent).not.toContain("馬");
		expect(outputContent).not.toContain("雞");

		// ID列は変換されていないことを確認
		expect(outputContent).toContain('"1"');
		expect(outputContent).toContain('"2"');
		expect(outputContent).toContain('"3"');
		expect(outputContent).toContain('"4"');
	});

	it("ヘッダーなしのCSVファイルを正しく処理する", async () => {
		// ヘッダーなしの入力ファイルを作成
		const inputNoHeaderData = [
			"1,龍王,古老的龍王",
			"2,鳳凰,美麗的鳳凰",
			"3,馬車,快速的馬車",
		].join("\n");
		fs.writeFileSync(inputPath, inputNoHeaderData, "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			},
			conversionTable: conversionPath,
			targetColumns: [1, 2],
			missingCharacterHandling: "skip",
		};

		const result = await processConversion(config);

		expect(result.success).toBe(true);
		expect(result.processedRows).toBe(3); // 全行がデータ行

		// 出力内容を確認
		const outputContent = fs.readFileSync(outputPath, "utf8");
		expect(outputContent).toContain("龙王");
		expect(outputContent).toContain("凤凰");
		expect(outputContent).toContain("马车");
	});

	it("特定の列のみを変換する", async () => {
		const config: ConversionConfig = {
			input: {
				path: inputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionPath,
			targetColumns: [1], // Name列のみ変換
			missingCharacterHandling: "skip",
		};

		const result = await processConversion(config);

		expect(result.success).toBe(true);

		const outputContent = fs.readFileSync(outputPath, "utf8");

		// Name列は変換される
		expect(outputContent).toContain("龙王");
		expect(outputContent).toContain("凤凰");

		// Description列は変換されない（繁体字のまま）
		expect(outputContent).toContain("古老的龍王");
		expect(outputContent).toContain("美麗的鳳凰");
	});

	it("変換表にない文字の処理（warnモード）", async () => {
		// 変換表にない文字を含む入力を作成
		const inputWithUnknownChars = [
			"ID,Name,Description",
			"1,龍王ABC,古老的龍王XYZ",
			"2,鳳凰123,美麗的鳳凰456",
		].join("\n");
		fs.writeFileSync(inputPath, inputWithUnknownChars, "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionPath,
			targetColumns: [1, 2],
			missingCharacterHandling: "warn",
		};

		const result = await processConversion(config);

		expect(result.success).toBe(true);
		expect(result.hasWarnings).toBe(true);

		const outputContent = fs.readFileSync(outputPath, "utf8");

		// 変換される文字
		expect(outputContent).toContain("龙王");
		expect(outputContent).toContain("凤凰");

		// 変換されない文字（そのまま残る）
		expect(outputContent).toContain("ABC");
		expect(outputContent).toContain("XYZ");
		expect(outputContent).toContain("123");
		expect(outputContent).toContain("456");
	});

	it("変換表ファイルが存在しない場合のエラー処理", async () => {
		const config: ConversionConfig = {
			input: {
				path: inputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: "non-existent-conversion.csv",
			targetColumns: [1, 2],
			missingCharacterHandling: "skip",
		};

		const result = await processConversion(config);

		expect(result.success).toBe(false);
		expect(result.errorMessage).toBeDefined();
	});

	it("入力ファイルが存在しない場合のエラー処理", async () => {
		const config: ConversionConfig = {
			input: {
				path: "non-existent-input.csv",
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionPath,
			targetColumns: [1, 2],
			missingCharacterHandling: "skip",
		};

		const result = await processConversion(config);

		expect(result.success).toBe(false);
		expect(result.errorMessage).toBeDefined();
	});
});
