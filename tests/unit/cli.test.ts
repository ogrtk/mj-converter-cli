import * as fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../../src/types/config.js";

// CLIモジュールをモック化（メイン関数は実行させない）
vi.mock("../../../src/utils/logger.js", () => ({
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

vi.mock("../../../src/processor.js", () => ({
	processConversion: vi.fn(() =>
		Promise.resolve({
			success: true,
			processedRows: 100,
			hasWarnings: false,
		}),
	),
}));

describe("cli.js設定検証", () => {
	const validConfig = {
		conversion: {
			input: {
				path: "input.csv",
				encoding: "utf8",
				lineBreak: "lf" as const,
				quote: '"',
				hasHeader: true,
			},
			output: {
				path: "output.csv",
				encoding: "utf8",
				lineBreak: "lf" as const,
				quote: '"',
				hasHeader: true,
			},
			conversionTable: "conversion.csv",
			targetColumns: [1, 2],
			missingCharacterHandling: "warn" as const,
		},
		logging: {
			level: "info" as const,
			output: "console" as const,
		},
	};

	// テスト用の設定ファイル検証関数を作成
	function validateConfig(config: unknown): void {
		const configObj = config as Record<string, unknown>;
		// 基本的なバリデーション
		if (!configObj.conversion) {
			throw new Error("設定ファイルに conversion セクションがありません");
		}

		const conversion = configObj.conversion as Record<string, unknown>;
		const input = conversion.input as Record<string, unknown>;
		const output = conversion.output as Record<string, unknown>;

		if (!input?.path) {
			throw new Error("入力ファイルパスが設定されていません");
		}

		if (!output?.path) {
			throw new Error("出力ファイルパスが設定されていません");
		}

		if (!conversion.conversionTable) {
			throw new Error("文字変換表パスが設定されていません");
		}

		if (
			!Array.isArray(conversion.targetColumns) ||
			conversion.targetColumns.length === 0
		) {
			throw new Error("対象列が設定されていません");
		}

		// hasHeaderのデフォルト値設定
		if (input.hasHeader === undefined) {
			input.hasHeader = false;
		}
		if (output.hasHeader === undefined) {
			output.hasHeader = false;
		}

		// ヘッダーの整合性チェック
		if (!input.hasHeader && output.hasHeader) {
			throw new Error(
				"入力ファイルにヘッダーがないのに、出力ファイルにヘッダーを出力することはできません",
			);
		}

		// missingCharacterHandlingのデフォルト値設定
		if (!conversion.missingCharacterHandling) {
			conversion.missingCharacterHandling = "skip";
		}

		// ログ設定のデフォルト値
		if (!configObj.logging) {
			configObj.logging = {
				level: "info",
				output: "file",
			};
		}
	}

	describe("設定ファイルバリデーション", () => {
		it("正しい設定ファイルが通る", () => {
			expect(() => validateConfig(validConfig)).not.toThrow();
		});

		it("conversionセクションがない場合エラー", () => {
			const config = { logging: validConfig.logging };
			expect(() => validateConfig(config)).toThrow(
				"設定ファイルに conversion セクションがありません",
			);
		});

		it("入力ファイルパスがない場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					input: { ...validConfig.conversion.input, path: "" },
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"入力ファイルパスが設定されていません",
			);
		});

		it("出力ファイルパスがない場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					output: { ...validConfig.conversion.output, path: "" },
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"出力ファイルパスが設定されていません",
			);
		});

		it("変換表パスがない場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					conversionTable: "",
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"文字変換表パスが設定されていません",
			);
		});

		it("対象列が空配列の場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					targetColumns: [],
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"対象列が設定されていません",
			);
		});

		it("対象列が配列でない場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					targetColumns: "not-an-array",
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"対象列が設定されていません",
			);
		});

		it("入力にヘッダーなし、出力にヘッダーありの場合エラー", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					input: { ...validConfig.conversion.input, hasHeader: false },
					output: { ...validConfig.conversion.output, hasHeader: true },
				},
			};
			expect(() => validateConfig(config)).toThrow(
				"入力ファイルにヘッダーがないのに、出力ファイルにヘッダーを出力することはできません",
			);
		});

		it("hasHeaderが未定義の場合、デフォルト値falseが設定される", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					input: { ...validConfig.conversion.input, hasHeader: undefined },
					output: { ...validConfig.conversion.output, hasHeader: undefined },
				},
			};

			validateConfig(config);

			expect(config.conversion.input.hasHeader).toBe(false);
			expect(config.conversion.output.hasHeader).toBe(false);
		});

		it("missingCharacterHandlingが未定義の場合、デフォルト値skipが設定される", () => {
			const config = {
				...validConfig,
				conversion: {
					...validConfig.conversion,
					missingCharacterHandling: undefined,
				},
			};

			validateConfig(config);

			expect(config.conversion.missingCharacterHandling).toBe("skip");
		});

		it("loggingが未定義の場合、デフォルト値が設定される", () => {
			const config = {
				conversion: validConfig.conversion,
			} as AppConfig;

			validateConfig(config);

			expect(config.logging).toEqual({
				level: "info",
				output: "file",
			});
		});
	});

	describe("JSONパース", () => {
		it("正しいJSONを解析する", () => {
			const jsonString = JSON.stringify(validConfig);
			const parsed = JSON.parse(jsonString);
			expect(parsed).toEqual(validConfig);
		});

		it("不正なJSONでSyntaxErrorを投げる", () => {
			const invalidJson = '{ "conversion": { "input":';
			expect(() => JSON.parse(invalidJson)).toThrow(SyntaxError);
		});

		it("空のJSONオブジェクトを処理する", () => {
			const emptyJson = "{}";
			const parsed = JSON.parse(emptyJson);
			expect(() => validateConfig(parsed)).toThrow();
		});
	});
});
