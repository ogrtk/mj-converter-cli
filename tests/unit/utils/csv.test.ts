import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FileConfig } from "../../../src/types/config.js";
import { readCsv, writeCsv } from "../../../src/utils/csv.js";

describe("csv.js", () => {
	const testDir = path.join(process.cwd(), "tests/fixtures/temp");
	const testInputPath = path.join(testDir, "test-input.csv");
	const testOutputPath = path.join(testDir, "test-output.csv");

	beforeEach(() => {
		// テスト用ディレクトリを作成
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}
	});

	afterEach(() => {
		// テストファイルをクリーンアップ
		try {
			if (fs.existsSync(testInputPath)) fs.unlinkSync(testInputPath);
			if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
		} catch (error) {
			// クリーンアップエラーは無視
		}
	});

	describe("readCsv", () => {
		it("基本的なCSVファイルを正しく読み込む", async () => {
			// テストデータを作成
			const csvContent =
				"ID,Name,Description\n1,龍王,古老的龍王\n2,鳳凰,美麗的鳳凰";
			fs.writeFileSync(testInputPath, csvContent, "utf8");

			const config: FileConfig = {
				path: testInputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			};

			const result = await readCsv(config);

			expect(result).toEqual([
				["ID", "Name", "Description"],
				["1", "龍王", "古老的龍王"],
				["2", "鳳凰", "美麗的鳳凰"],
			]);
		});

		it("引用符を含むCSVを正しく処理する", async () => {
			const csvContent = 'ID,"Name with, comma",Description\n1,"龍,王",說你好';
			fs.writeFileSync(testInputPath, csvContent, "utf8");

			const config: FileConfig = {
				path: testInputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			};

			const result = await readCsv(config);

			expect(result[0]).toEqual(["ID", "Name with, comma", "Description"]);
			expect(result[1]).toEqual(["1", "龍,王", "說你好"]);
		});

		it("空のCSVファイルを正しく処理する", async () => {
			fs.writeFileSync(testInputPath, "", "utf8");

			const config: FileConfig = {
				path: testInputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			};

			const result = await readCsv(config);
			expect(result).toEqual([]);
		});

		it("存在しないファイルでエラーを投げる", async () => {
			const config: FileConfig = {
				path: "non-existent-file.csv",
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			};

			await expect(readCsv(config)).rejects.toThrow();
		});

		it("異なる改行コードを正しく処理する", async () => {
			// CRLF改行でファイルを作成
			const csvContent = "ID,Name\r\n1,龍王\r\n2,鳳凰";
			fs.writeFileSync(testInputPath, csvContent, "utf8");

			const config: FileConfig = {
				path: testInputPath,
				encoding: "utf8",
				lineBreak: "crlf",
				quote: '"',
				hasHeader: true,
			};

			const result = await readCsv(config);

			expect(result).toEqual([
				["ID", "Name"],
				["1", "龍王"],
				["2", "鳳凰"],
			]);
		});
	});

	describe("writeCsv", () => {
		it("基本的なCSVファイルを正しく書き込む", async () => {
			const data = [
				["ID", "Name", "Description"],
				["1", "龙王", "古老的龙王"],
				["2", "凤凰", "美丽的凤凰"],
			];

			const config: FileConfig = {
				path: testOutputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			};

			await writeCsv(data, config);

			// ファイルが作成されたことを確認
			expect(fs.existsSync(testOutputPath)).toBe(true);

			// 内容を読み戻して確認
			const result = await readCsv(config);
			expect(result).toEqual(data);
		});

		it("引用符が必要なデータを正しく書き込む", async () => {
			const data = [
				["ID", "Name with, comma", 'Description with "quotes"'],
				["1", "龙,王", '说:"你好"'],
			];

			const config: FileConfig = {
				path: testOutputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: true,
			};

			await writeCsv(data, config);

			// 内容を読み戻して確認
			const result = await readCsv(config);
			expect(result).toEqual(data);
		});

		it("空のデータを正しく書き込む", async () => {
			const data: string[][] = [];

			const config: FileConfig = {
				path: testOutputPath,
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			};

			await writeCsv(data, config);

			// ファイルが作成されたことを確認
			expect(fs.existsSync(testOutputPath)).toBe(true);

			// 内容を読み戻して確認
			const result = await readCsv(config);
			expect(result).toEqual([]);
		});

		it("異なる改行コードで正しく書き込む", async () => {
			const data = [
				["ID", "Name"],
				["1", "龙王"],
				["2", "凤凰"],
			];

			const config: FileConfig = {
				path: testOutputPath,
				encoding: "utf8",
				lineBreak: "crlf",
				quote: '"',
				hasHeader: true,
			};

			await writeCsv(data, config);

			// ファイルの内容を直接確認
			const content = fs.readFileSync(testOutputPath, "utf8");
			expect(content).toContain("\r\n");
		});

		it("書き込み不可能なパスでエラーを投げる", async () => {
			const data = [["test"]];

			const config: FileConfig = {
				path: "/invalid/path/file.csv",
				encoding: "utf8",
				lineBreak: "lf",
				quote: '"',
				hasHeader: false,
			};

			await expect(writeCsv(data, config)).rejects.toThrow();
		});
	});
});
