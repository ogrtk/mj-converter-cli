import { describe, expect, it } from "vitest";
import {
	isCharacterEncodable,
	validateEncoding,
} from "../../../src/utils/character-set.js";

describe("character-set", () => {
	describe("validateEncoding", () => {
		it("should validate supported encodings", () => {
			expect(validateEncoding("utf8")).toBe(true);
			expect(validateEncoding("shift_jis")).toBe(true);
			expect(validateEncoding("euc-jp")).toBe(true);
			expect(validateEncoding("gb2312")).toBe(true);
			expect(validateEncoding("big5")).toBe(true);
		});

		it("should reject unsupported encodings", () => {
			expect(validateEncoding("invalid-encoding")).toBe(false);
			expect(validateEncoding("")).toBe(false);
		});
	});

	describe("isCharacterEncodable", () => {
		it("should return true for characters that can be encoded in shift_jis", () => {
			expect(isCharacterEncodable("あ", "shift_jis")).toBe(true);
			expect(isCharacterEncodable("漢", "shift_jis")).toBe(true);
			expect(isCharacterEncodable("字", "shift_jis")).toBe(true);
			expect(isCharacterEncodable("A", "shift_jis")).toBe(true);
			expect(isCharacterEncodable("1", "shift_jis")).toBe(true);
		});

		it("should return false for characters that cannot be encoded in shift_jis", () => {
			expect(isCharacterEncodable("𝕏", "shift_jis")).toBe(false);
			expect(isCharacterEncodable("🙂", "shift_jis")).toBe(false);
		});

		it("should work with different encodings", () => {
			expect(isCharacterEncodable("中", "gb2312")).toBe(true);
			expect(isCharacterEncodable("中", "big5")).toBe(true);
			expect(isCharacterEncodable("🙂", "utf8")).toBe(true);
		});

		it("should handle invalid encoding gracefully", () => {
			expect(isCharacterEncodable("あ", "invalid-encoding")).toBe(false);
		});
	});
});
