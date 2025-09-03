export interface FileConfig {
	path: string;
	encoding: string;
	lineBreak: "crlf" | "lf" | "cr";
	quote: string;
	hasHeader: boolean;
	quoted?: boolean;
}

export interface CharacterSetValidation {
	enabled: boolean;
	targetEncoding: string;
	undefinedCharacterHandling: "error" | "warn";
	altChar?: string;
}

export interface ConversionConfig {
	input: FileConfig;
	output: FileConfig;
	conversionTable: string;
	targetColumns: number[];
	missingCharacterHandling: "error" | "skip" | "warn";
	characterSetValidation?: CharacterSetValidation;
}

export interface AppConfig {
	conversion: ConversionConfig;
	logging: {
		level: "error" | "warn" | "info" | "debug";
		output: "console" | "file";
		logFile?: string;
	};
}
