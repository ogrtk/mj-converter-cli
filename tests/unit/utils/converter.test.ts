import * as fs from "node:fs";
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ConversionMap,
	convertCsvRecord,
	convertString,
	convertStringWithHandling,
	loadConversionTable,
} from "../../../src/utils/converter.js";

// CSV読み込みのモックを作成
vi.mock("../../../src/utils/csv.js", () => ({
	readCsv: vi.fn().mockResolvedValue([
		["龍", "龙"],
		["鳳", "凤"],
		["車", "车"],
		["馬", "马"],
	]),
}));

vi.mock("../../../src/utils/logger.js", () => ({
	getLogger: () => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	}),
}));

describe("converter.js", () => {
	describe("convertString", () => {
		let conversionMap: ConversionMap;

		beforeEach(() => {
			conversionMap = new Map([
				["龍", "龙"],
				["鳳", "凤"],
				["車", "车"],
				["馬", "马"],
			]);
		});

		it("文字変換が正しく行われる", () => {
			const result = convertString("龍王", conversionMap);
			expect(result).toBe("龙王");
		});

		it("変換表にない文字はそのまま保持される", () => {
			const result = convertString("龍A鳳", conversionMap);
			expect(result).toBe("龙A凤");
		});

		it("空文字列を正しく処理する", () => {
			const result = convertString("", conversionMap);
			expect(result).toBe("");
		});

		it("すべての文字が変換表にない場合、元の文字列を返す", () => {
			const result = convertString("ABC", conversionMap);
			expect(result).toBe("ABC");
		});

		it("複数文字の変換が正しく行われる", () => {
			const result = convertString("龍鳳車馬", conversionMap);
			expect(result).toBe("龙凤车马");
		});

		it("空文字への変換（削除）が正しく行われる", () => {
			conversionMap.set("删", "");
			const result = convertString("龍删鳳", conversionMap);
			expect(result).toBe("龙凤");
		});
	});

	describe("convertStringWithHandling", () => {
		let conversionMap: ConversionMap;

		beforeEach(() => {
			conversionMap = new Map([
				["龍", "龙"],
				["鳳", "凤"],
			]);
		});

		it("skipモードで変換表にない文字をそのまま保持する", () => {
			const result = convertStringWithHandling("龍A鳳", conversionMap, "skip");
			expect(result.convertedValue).toBe("龙A凤");
			expect(result.hasWarnings).toBe(false);
		});

		it("warnモードで警告フラグを設定する", () => {
			const result = convertStringWithHandling("龍A鳳", conversionMap, "warn");
			expect(result.convertedValue).toBe("龙A凤");
			expect(result.hasWarnings).toBe(true);
		});

		it("errorモードで例外を投げる", () => {
			expect(() => {
				convertStringWithHandling("龍A鳳", conversionMap, "error");
			}).toThrow('文字変換表に文字 "A" が見つかりません');
		});

		it("変換表にある文字のみの場合は警告なし", () => {
			const result = convertStringWithHandling("龍鳳", conversionMap, "warn");
			expect(result.convertedValue).toBe("龙凤");
			expect(result.hasWarnings).toBe(false);
		});
	});

	describe("convertCsvRecord", () => {
		let conversionMap: ConversionMap;

		beforeEach(() => {
			conversionMap = new Map([
				["龍", "龙"],
				["鳳", "凤"],
				["車", "车"],
			]);
		});

		it("指定された列のみを変換する", () => {
			const record = ["ID", "龍王", "鳳凰車"];
			const result = convertCsvRecord(record, [1, 2], conversionMap, "skip");

			expect(result.record).toEqual(["ID", "龙王", "凤凰车"]);
			expect(result.hasWarnings).toBe(false);
		});

		it("範囲外の列インデックスで警告を設定する", () => {
			const record = ["ID", "龍王"];
			const result = convertCsvRecord(record, [1, 5], conversionMap, "skip");

			expect(result.record).toEqual(["ID", "龙王"]);
			expect(result.hasWarnings).toBe(true);
		});

		it("空の値を正しく処理する", () => {
			const record = ["ID", "", "鳳凰"];
			const result = convertCsvRecord(record, [1, 2], conversionMap, "skip");

			expect(result.record).toEqual(["ID", "", "凤凰"]);
			expect(result.hasWarnings).toBe(false);
		});

		it("負の列インデックスを正しく処理する", () => {
			const record = ["ID", "龍王"];
			const result = convertCsvRecord(record, [-1, 1], conversionMap, "skip");

			expect(result.record).toEqual(["ID", "龙王"]);
			expect(result.hasWarnings).toBe(true);
		});

		it("変換で警告が発生した場合、全体の警告フラグが立つ", () => {
			const record = ["ID", "龍A", "鳳B"];
			const result = convertCsvRecord(record, [1, 2], conversionMap, "warn");

			expect(result.record).toEqual(["ID", "龙A", "凤B"]);
			expect(result.hasWarnings).toBe(true);
		});
	});

	describe("loadConversionTable", () => {
		it("CSVデータから変換表を読み込む", async () => {
			const result = await loadConversionTable("dummy-path.csv");

			expect(result).toBeInstanceOf(Map);
			expect(result.get("龍")).toBe("龙");
			expect(result.get("鳳")).toBe("凤");
			expect(result.get("車")).toBe("车");
			expect(result.get("馬")).toBe("马");
			expect(result.size).toBe(4);
		});
	});
});
