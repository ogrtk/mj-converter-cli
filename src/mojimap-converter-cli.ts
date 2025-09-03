#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { convertMappingTable } from "./utils/mojimap-converter";

async function main(): Promise<void> {
	const argv = await yargs(hideBin(process.argv))
		.usage("Usage: $0 <inputFile> <outputMJtoHK> <outputHKtoMJ>")
		.command(
			"$0 <inputFile> <outputMJtoHK> <outputHKtoMJ>",
			"Convert mapping table to MJtoHK and HKtoMJ formats",
			(yargs) => {
				return yargs
					.positional("inputFile", {
						describe: "Path to input CSV file with mapping data",
						type: "string",
						demandOption: true,
					})
					.positional("outputMJtoHK", {
						describe: "Path for MJtoHK mapping output file",
						type: "string",
						demandOption: true,
					})
					.positional("outputHKtoMJ", {
						describe: "Path for HKtoMJ mapping output file",
						type: "string",
						demandOption: true,
					});
			},
			(argv) => {
				console.log("Converting mapping table...");
				console.log(`Input file: ${argv.inputFile}`);
				console.log(`Output MJtoHK: ${argv.outputMJtoHK}`);
				console.log(`Output HKtoMJ: ${argv.outputHKtoMJ}`);

				convertMappingTable(
					argv.inputFile,
					argv.outputMJtoHK,
					argv.outputHKtoMJ,
				);

				console.log("Conversion completed successfully!");
			},
		)
		.example(
			"$0 input.csv mj-to-hk.csv hk-to-mj.csv",
			"Convert mapping table from input.csv",
		)
		.help()
		.alias("help", "h")
		.version(false)
		.parseAsync();
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
