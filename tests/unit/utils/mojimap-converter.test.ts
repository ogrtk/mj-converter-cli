import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { convertMappingTable } from "../../../src/utils/mojimap-converter.js";

describe("mojimap-converter.js", () => {
	const testDir = path.join(process.cwd(), "tests/fixtures/temp");
	const testInputPath = path.join(testDir, "test-mapping.csv");
	const testMjToHkPath = path.join(testDir, "test-mj-to-hk.csv");
	const testHkToMjPath = path.join(testDir, "test-hk-to-mj.csv");

	beforeEach(() => {
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}
	});

	afterEach(() => {
		try {
			if (fs.existsSync(testInputPath)) fs.unlinkSync(testInputPath);
			if (fs.existsSync(testMjToHkPath)) fs.unlinkSync(testMjToHkPath);
			if (fs.existsSync(testHkToMjPath)) fs.unlinkSync(testHkToMjPath);
		} catch (error) {
			// クリーンアップエラーは無視
		}
	});

	describe("convertMappingTable", () => {
		it("IVSCharが優先されて変換される", () => {
			const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+570B,國,U+56FD,1,U+56FD,国,U+56FD+E0101,国󠄁,U+56FD,国`;

			fs.writeFileSync(testInputPath, mappingData, "utf-8");

			convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

			const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
			const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

			expect(mjToHkContent).toBe('"国󠄁","國"');
			expect(hkToMjContent).toBe('"國","国󠄁"');
		});

		it("RealCharがIVSCharなしの場合に使用される", () => {
			const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+9AD4,體,U+4F53,1,U+4F53,体,,,U+4F53,体`;

			fs.writeFileSync(testInputPath, mappingData, "utf-8");

			convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

			const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
			const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

			expect(mjToHkContent).toBe('"体","體"');
			expect(hkToMjContent).toBe('"體","体"');
		});

		it("UnicodeCharがIVSCharとRealCharなしの場合に使用される", () => {
			const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+5C08,專,U+5C02,1,,,,,U+5C02,専`;

			fs.writeFileSync(testInputPath, mappingData, "utf-8");

			convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

			const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
			const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

			expect(mjToHkContent).toBe('"専","專"');
			expect(hkToMjContent).toBe('"專","専"');
		});

		it("複数の変換ルールを正しく処理する", () => {
			const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+570B,國,U+56FD,1,U+56FD,国,U+56FD+E0101,国󠄁,U+56FD,国
U+9AD4,體,U+4F53,1,U+4F53,体,,,U+4F53,体
U+5C08,專,U+5C02,1,,,,,U+5C02,専`;

			fs.writeFileSync(testInputPath, mappingData, "utf-8");

			convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

			const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
			const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

			expect(mjToHkContent).toContain('"国󠄁","國"');
			expect(mjToHkContent).toContain('"体","體"');
			expect(mjToHkContent).toContain('"専","專"');

			expect(hkToMjContent).toContain('"國","国󠄁"');
			expect(hkToMjContent).toContain('"體","体"');
			expect(hkToMjContent).toContain('"專","専"');
		});

		it("空のフィールドがある場合はスキップされる", () => {
			const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+570B,,U+56FD,1,U+56FD,国,U+56FD+E0101,国󠄁,U+56FD,国
U+9AD4,體,U+4F53,1,U+4F53,,,,U+4F53,体`;

			fs.writeFileSync(testInputPath, mappingData, "utf-8");

			convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

			const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
			const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

			expect(mjToHkContent).toBe('"体","體"');
			expect(hkToMjContent).toBe('"體","体"');
		});
	});
});
