import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { processConversion } from "../../src/processor.js";
import type { ConversionConfig } from "../../src/types/config.js";
import { initLogger } from "../../src/utils/logger.js";

describe("Character Encoding Validation Integration", () => {
	const testDir = "/tmp/encoding-test";
	const inputFile = join(testDir, "input.csv");
	const outputFile = join(testDir, "output.csv");
	const conversionFile = join(testDir, "conversion.csv");

	beforeEach(() => {
		if (!existsSync(testDir)) {
			mkdirSync(testDir, { recursive: true });
		}
		initLogger({ level: "error", output: "console" });
	});

	afterEach(() => {
		for (const file of [inputFile, outputFile, conversionFile]) {
			if (existsSync(file)) {
				unlinkSync(file);
			}
		}
	});

	it("should validate characters against shift_jis encoding", async () => {
		writeFileSync(inputFile, "Name,Text\n田中,漢字テスト", "utf8");
		writeFileSync(conversionFile, "漢,汉\n字,字", "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionFile,
			targetColumns: [1],
			missingCharacterHandling: "warn",
			characterSetValidation: {
				enabled: true,
				targetEncoding: "shift_jis",
				undefinedCharacterHandling: "warn",
			},
		};

		const result = await processConversion(config);
		expect(result.success).toBe(true);
	});

	it("should handle encoding validation errors", async () => {
		writeFileSync(inputFile, "Name,Text\n田中,漢字🙂", "utf8");
		writeFileSync(conversionFile, "漢,汉\n字,字", "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionFile,
			targetColumns: [1],
			missingCharacterHandling: "warn",
			characterSetValidation: {
				enabled: true,
				targetEncoding: "shift_jis",
				undefinedCharacterHandling: "error",
			},
		};

		const result = await processConversion(config);
		expect(result.success).toBe(false);
		expect(result.errorMessage).toContain(
			"が shift_jis に含まれません",
		);
	});

	it("should work without encoding validation when disabled", async () => {
		writeFileSync(inputFile, "Name,Text\n田中,漢字テスト", "utf8");
		writeFileSync(conversionFile, "漢,汉\n字,字", "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionFile,
			targetColumns: [1],
			missingCharacterHandling: "warn",
		};

		const result = await processConversion(config);
		expect(result.success).toBe(true);
	});

	it("should replace characters with replacement character", async () => {
		writeFileSync(inputFile, "Name,Text\n田中,漢字🙂", "utf8");
		writeFileSync(conversionFile, "漢,汉\n字,字", "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionFile,
			targetColumns: [1],
			missingCharacterHandling: "warn",
			characterSetValidation: {
				enabled: true,
				targetEncoding: "shift_jis",
				undefinedCharacterHandling: "warn",
				altChar: "?",
			},
		};

		const result = await processConversion(config);
		expect(result.success).toBe(true);
		expect(result.hasWarnings).toBe(true);

		// 出力ファイルの内容を確認
		const outputContent = readFileSync(outputFile, "utf8");
		expect(outputContent).toContain("汉字?");
	});

	it("should handle invalid encoding", async () => {
		writeFileSync(inputFile, "Name,Text\n田中,漢字", "utf8");
		writeFileSync(conversionFile, "漢,汉\n字,字", "utf8");

		const config: ConversionConfig = {
			input: {
				path: inputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: outputFile,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			},
			conversionTable: conversionFile,
			targetColumns: [1],
			missingCharacterHandling: "warn",
			characterSetValidation: {
				enabled: true,
				targetEncoding: "invalid-encoding",
				undefinedCharacterHandling: "warn",
			},
		};

		const result = await processConversion(config);
		expect(result.success).toBe(false);
		expect(result.errorMessage).toContain(
			"サポートされていないエンコーディング",
		);
	});
});
