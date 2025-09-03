import * as fs from "node:fs";
import { parse } from "csv-parse/sync";

interface SourceMappingRow {
	HKCode: string;
	HKChar: string;
	MJCode: string;
	KanjiLevel: string;
	RealCode: string;
	RealChar: string;
	IVSCode: string;
	IVSChar: string;
	UnicodeCode: string;
	UnicodeChar: string;
}

function determineNewChar(row: SourceMappingRow): string {
	if (row.IVSChar && row.IVSChar.trim() !== "") {
		return row.IVSChar;
	}
	if (row.RealChar && row.RealChar.trim() !== "") {
		return row.RealChar;
	}
	return row.UnicodeChar;
}

export function convertMappingTable(
	inputPath: string,
	outputMJtoHKPath: string,
	outputHKtoMJPath: string,
): void {
	try {
		const csvContent = fs.readFileSync(inputPath, "utf-8");

		const records = parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		}) as SourceMappingRow[];

		const mjToHkMap = new Map<string, string>();
		const hkToMjMap = new Map<string, string>();

		for (const row of records) {
			const hkChar = row.HKChar;
			const newChar = determineNewChar(row);

			if (hkChar && newChar) {
				mjToHkMap.set(newChar, hkChar);
				hkToMjMap.set(hkChar, newChar);
			}
		}

		const mjToHkCsv = Array.from(mjToHkMap.entries())
			.map(([from, to]) => `"${from}","${to}"`)
			.join("\n");

		const hkToMjCsv = Array.from(hkToMjMap.entries())
			.map(([from, to]) => `"${from}","${to}"`)
			.join("\n");

		fs.writeFileSync(outputMJtoHKPath, mjToHkCsv, "utf-8");
		fs.writeFileSync(outputHKtoMJPath, hkToMjCsv, "utf-8");

		console.log(
			`Generated MJtoHK mapping: ${outputMJtoHKPath} (${mjToHkMap.size} entries)`,
		);
		console.log(
			`Generated HKtoMJ mapping: ${outputHKtoMJPath} (${hkToMjMap.size} entries)`,
		);
	} catch (error) {
		console.error("Error converting mapping table:", error);
		process.exit(1);
	}
}
