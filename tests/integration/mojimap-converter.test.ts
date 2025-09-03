import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { convertMappingTable } from "../../src/utils/mojimap-converter.js";

describe("mojimap-converter integration tests", () => {
	const testDir = path.join(process.cwd(), "tests/fixtures/temp/integration");
	const testInputPath = path.join(testDir, "integration-mapping.csv");
	const testMjToHkPath = path.join(testDir, "integration-mj-to-hk.csv");
	const testHkToMjPath = path.join(testDir, "integration-hk-to-mj.csv");

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

	it("実際のmojimapデータで完全な変換処理を実行する", () => {
		const mappingData = `HKCode,HKChar,MJCode,KanjiLevel,RealCode,RealChar,IVSCode,IVSChar,UnicodeCode,UnicodeChar
U+570B,國,U+56FD,1,U+56FD,国,U+56FD+E0101,国󠄁,U+56FD,国
U+9AD4,體,U+4F53,1,U+4F53,体,,,U+4F53,体
U+5B78,學,U+5B66,1,U+5B66,学,U+5B66+E0100,学󠄀,U+5B66,学
U+5C08,專,U+5C02,1,,,,,U+5C02,専
U+8B93,讓,U+8B72,1,U+8B72,譲,,,U+8B72,譲
U+5C0D,對,U+5BFE,1,U+5BFE,対,U+5BFE+E0101,対󠄁,U+5BFE,対
U+6703,會,U+4F1A,1,,,U+4F1A+E0100,会󠄀,U+4F1A,会
U+7576,當,U+5F53,1,U+5F53,当,,,U+5F53,当
U+5716,圖,U+56F3,1,,,,,U+56F3,図
U+65B0,新,U+65B0,2,U+65B0,新,U+65B0+E0101,新󠄁,U+65B0,新`;

		fs.writeFileSync(testInputPath, mappingData, "utf-8");

		convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

		expect(fs.existsSync(testMjToHkPath)).toBe(true);
		expect(fs.existsSync(testHkToMjPath)).toBe(true);

		const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
		const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

		// IVSChar優先の確認
		expect(mjToHkContent).toContain('"国󠄁","國"');
		expect(mjToHkContent).toContain('"学󠄀","學"');
		expect(mjToHkContent).toContain('"対󠄁","對"');
		expect(mjToHkContent).toContain('"会󠄀","會"');
		expect(mjToHkContent).toContain('"新󠄁","新"');

		// RealChar使用の確認
		expect(mjToHkContent).toContain('"体","體"');
		expect(mjToHkContent).toContain('"譲","讓"');
		expect(mjToHkContent).toContain('"当","當"');

		// UnicodeChar使用の確認
		expect(mjToHkContent).toContain('"専","專"');
		expect(mjToHkContent).toContain('"図","圖"');

		// 逆変換の確認
		expect(hkToMjContent).toContain('"國","国󠄁"');
		expect(hkToMjContent).toContain('"學","学󠄀"');
		expect(hkToMjContent).toContain('"體","体"');
		expect(hkToMjContent).toContain('"專","専"');
	});

	it("エラーハンドリング: 存在しないファイルでエラーが発生する", () => {
		expect(() => {
			convertMappingTable("non-existent.csv", testMjToHkPath, testHkToMjPath);
		}).toThrow();
	});

	it("エラーハンドリング: 無効なCSVフォーマットは処理されるが0件の結果となる", () => {
		const invalidCsvData = "invalid,csv,format\nwithout,proper,headers";
		fs.writeFileSync(testInputPath, invalidCsvData, "utf-8");

		convertMappingTable(testInputPath, testMjToHkPath, testHkToMjPath);

		const mjToHkContent = fs.readFileSync(testMjToHkPath, "utf-8");
		const hkToMjContent = fs.readFileSync(testHkToMjPath, "utf-8");

		expect(mjToHkContent).toBe("");
		expect(hkToMjContent).toBe("");
	});
});
