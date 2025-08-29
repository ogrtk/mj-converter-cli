import { beforeEach, describe, expect, it, vi } from "vitest";
import type winston from "winston";

// すべての外部依存をモック化
vi.mock("node:fs");
vi.mock("../../src/utils/logger.js");
vi.mock("../../src/processor.js");

describe("main関数の統合テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		// デフォルトのプロセス引数をモック
		vi.spyOn(process, "argv", "get").mockReturnValue([
			"node",
			"cli.js",
			"--config",
			"test-config.json",
		]);
	});

	it("正常ケースで終了コード0を返す", async () => {
		const fs = await import("node:fs");
		const { initLogger } = await import("../../src/utils/logger.js");
		const { processConversion } = await import("../../src/processor.js");

		const validConfigStr = JSON.stringify({
			conversion: {
				input: { path: "input.csv", hasHeader: true },
				output: { path: "output.csv", hasHeader: true },
				conversionTable: "conversion.csv",
				targetColumns: [1, 2],
				missingCharacterHandling: "warn",
			},
			logging: { level: "info", output: "console" },
		});

		// ファイル存在チェックとファイル読み込みをモック
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(validConfigStr);
		vi.mocked(fs.mkdirSync).mockImplementation(() => "");

		// ロガーをモック
		vi.mocked(initLogger).mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as winston.Logger);

		// processConversionをモック
		vi.mocked(processConversion).mockResolvedValue({
			success: true,
			processedRows: 100,
			hasWarnings: false,
		});

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(0);
	});

	it("設定ファイルが存在しない場合終了コード1を返す", async () => {
		const fs = await import("node:fs");

		// 設定ファイルが存在しないようにモック
		vi.mocked(fs.existsSync).mockReturnValue(false);

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(1);
	});

	it("入力ファイルが存在しない場合終了コード1を返す", async () => {
		const fs = await import("node:fs");
		const { initLogger } = await import("../../src/utils/logger.js");

		const validConfigStr = JSON.stringify({
			conversion: {
				input: { path: "nonexistent.csv", hasHeader: true },
				output: { path: "output.csv", hasHeader: true },
				conversionTable: "conversion.csv",
				targetColumns: [1, 2],
			},
			logging: { level: "info", output: "console" },
		});

		vi.mocked(fs.existsSync)
			.mockReturnValueOnce(true) // 設定ファイル存在
			.mockReturnValueOnce(false); // 入力ファイル不存在

		vi.mocked(fs.readFileSync).mockReturnValue(validConfigStr);
		vi.mocked(initLogger).mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as winston.Logger);

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(1);
	});

	it("変換表ファイルが存在しない場合終了コード1を返す", async () => {
		const fs = await import("node:fs");
		const { initLogger } = await import("../../src/utils/logger.js");

		const validConfigStr = JSON.stringify({
			conversion: {
				input: { path: "input.csv", hasHeader: true },
				output: { path: "output.csv", hasHeader: true },
				conversionTable: "nonexistent.csv",
				targetColumns: [1, 2],
			},
			logging: { level: "info", output: "console" },
		});

		vi.mocked(fs.existsSync)
			.mockReturnValueOnce(true) // 設定ファイル存在
			.mockReturnValueOnce(true) // 入力ファイル存在
			.mockReturnValueOnce(false); // 変換表不存在

		vi.mocked(fs.readFileSync).mockReturnValue(validConfigStr);
		vi.mocked(initLogger).mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as winston.Logger);

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(1);
	});

	it("処理で警告がある場合終了コード2を返す", async () => {
		const fs = await import("node:fs");
		const { initLogger } = await import("../../src/utils/logger.js");
		const { processConversion } = await import("../../src/processor.js");

		const validConfigStr = JSON.stringify({
			conversion: {
				input: { path: "input.csv", hasHeader: true },
				output: { path: "output.csv", hasHeader: true },
				conversionTable: "conversion.csv",
				targetColumns: [1, 2],
			},
			logging: { level: "info", output: "console" },
		});

		// 全ファイル存在、ディレクトリ存在
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(validConfigStr);
		vi.mocked(fs.mkdirSync).mockImplementation(() => "");

		vi.mocked(initLogger).mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as winston.Logger);

		// processConversionを警告ありで成功するようにモック
		vi.mocked(processConversion).mockResolvedValue({
			success: true,
			processedRows: 100,
			hasWarnings: true,
		});

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(2);
	});

	it("処理が失敗した場合終了コード1を返す", async () => {
		const fs = await import("node:fs");
		const { initLogger } = await import("../../src/utils/logger.js");
		const { processConversion } = await import("../../src/processor.js");

		const validConfigStr = JSON.stringify({
			conversion: {
				input: { path: "input.csv", hasHeader: true },
				output: { path: "output.csv", hasHeader: true },
				conversionTable: "conversion.csv",
				targetColumns: [1, 2],
			},
			logging: { level: "info", output: "console" },
		});

		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(validConfigStr);
		vi.mocked(fs.mkdirSync).mockImplementation(() => "");

		vi.mocked(initLogger).mockReturnValue({
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as winston.Logger);

		// processConversionを失敗するようにモック
		vi.mocked(processConversion).mockResolvedValue({
			success: false,
			processedRows: 0,
			hasWarnings: false,
			errorMessage: "テスト用エラー",
		});

		const { main } = await import("../../src/cli.js");
		const exitCode = await main();

		expect(exitCode).toBe(1);
	});
});
