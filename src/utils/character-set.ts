import iconv from "iconv-lite";

export function isCharacterEncodable(char: string, encoding: string): boolean {
	try {
		const encoded = iconv.encode(char, encoding);
		const decoded = iconv.decode(encoded, encoding);
		return decoded === char;
	} catch (error) {
		return false;
	}
}

export function validateEncoding(encoding: string): boolean {
	return iconv.encodingExists(encoding);
}
