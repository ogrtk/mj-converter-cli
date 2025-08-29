import { describe, expect, it } from "vitest";
import {
	countCharacters,
	getCharAt,
	joinCharacters,
	splitCharacters,
} from "../../../src/utils/unicode.js";

describe("unicode.js", () => {
	describe("splitCharacters", () => {
		it("通常の文字列を正しく分割する", () => {
			const result = splitCharacters("龍鳳車");
			expect(result).toEqual(["龍", "鳳", "車"]);
		});

		it("空文字列を処理する", () => {
			const result = splitCharacters("");
			expect(result).toEqual([]);
		});

		it("英数字を正しく分割する", () => {
			const result = splitCharacters("ABC123");
			expect(result).toEqual(["A", "B", "C", "1", "2", "3"]);
		});

		it("絵文字を正しく分割する", () => {
			const result = splitCharacters("🐉🦅🚗");
			expect(result).toEqual(["🐉", "🦅", "🚗"]);
		});

		it("結合文字を正しく処理する", () => {
			const result = splitCharacters("👨‍👩‍👧‍👦");
			expect(result).toEqual(["👨‍👩‍👧‍👦"]);
		});

		it("混合文字列を正しく分割する", () => {
			const result = splitCharacters("龍A1🐉");
			expect(result).toEqual(["龍", "A", "1", "🐉"]);
		});
	});

	describe("countCharacters", () => {
		it("通常の文字列の文字数を正しく数える", () => {
			const result = countCharacters("龍鳳車");
			expect(result).toBe(3);
		});

		it("空文字列の文字数を正しく数える", () => {
			const result = countCharacters("");
			expect(result).toBe(0);
		});

		it("絵文字を含む文字列の文字数を正しく数える", () => {
			const result = countCharacters("🐉🦅🚗");
			expect(result).toBe(3);
		});

		it("結合文字を含む文字列の文字数を正しく数える", () => {
			const result = countCharacters("👨‍👩‍👧‍👦ABC");
			expect(result).toBe(4);
		});
	});

	describe("getCharAt", () => {
		it("指定位置の文字を正しく取得する", () => {
			const text = "龍鳳車";
			expect(getCharAt(text, 0)).toBe("龍");
			expect(getCharAt(text, 1)).toBe("鳳");
			expect(getCharAt(text, 2)).toBe("車");
		});

		it("範囲外のインデックスでundefinedを返す", () => {
			const text = "龍鳳車";
			expect(getCharAt(text, 3)).toBeUndefined();
			expect(getCharAt(text, -1)).toBeUndefined();
		});

		it("空文字列でundefinedを返す", () => {
			expect(getCharAt("", 0)).toBeUndefined();
		});

		it("絵文字を含む文字列で正しく動作する", () => {
			const text = "🐉龍🦅";
			expect(getCharAt(text, 0)).toBe("🐉");
			expect(getCharAt(text, 1)).toBe("龍");
			expect(getCharAt(text, 2)).toBe("🦅");
		});
	});

	describe("joinCharacters", () => {
		it("文字配列を正しく結合する", () => {
			const chars = ["龍", "鳳", "車"];
			const result = joinCharacters(chars);
			expect(result).toBe("龍鳳車");
		});

		it("空配列を正しく処理する", () => {
			const result = joinCharacters([]);
			expect(result).toBe("");
		});

		it("単一文字を正しく処理する", () => {
			const result = joinCharacters(["龍"]);
			expect(result).toBe("龍");
		});

		it("絵文字を含む配列を正しく結合する", () => {
			const chars = ["🐉", "龍", "🦅"];
			const result = joinCharacters(chars);
			expect(result).toBe("🐉龍🦅");
		});
	});
});
