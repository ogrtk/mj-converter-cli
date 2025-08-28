import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import iconv from 'iconv-lite';
import * as fs from 'fs';
import type { FileConfig } from '../types/config.js';

/**
 * 改行コードを実際の文字に変換
 */
function getLineBreakChar(lineBreak: 'crlf' | 'lf' | 'cr'): string {
  switch (lineBreak) {
    case 'crlf': return '\r\n';
    case 'lf': return '\n';
    case 'cr': return '\r';
  }
}

/**
 * CSVファイルを読み込んで2次元配列として返す
 */
export async function readCsv(config: FileConfig): Promise<string[][]> {
  try {
    const buffer = fs.readFileSync(config.path);
    const content = iconv.decode(buffer, config.encoding);
    
    const records: string[][] = [];
    
    return await new Promise<string[][]>((resolve, reject) => {
      const parser = parse(content, {
        quote: config.quote,
        delimiter: ',',
        record_delimiter: getLineBreakChar(config.lineBreak),
        skip_empty_lines: false,
        relax_quotes: true,
        escape: config.quote
      });
      
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });
      
      parser.on('error', function(err) {
        reject(new Error(`CSV読み込みエラー: ${err.message}`));
      });
      
      parser.on('end', function() {
        resolve(records);
      });
    });
  } catch (error) {
    throw new Error(`ファイル読み込みエラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 2次元配列をCSVファイルとして書き込む
 */
export async function writeCsv(data: string[][], config: FileConfig): Promise<void> {
  try {
    const records: string[] = [];
    
    await new Promise<void>((resolve, reject) => {
      const stringifier = stringify(data, {
        quote: config.quote,
        delimiter: ',',
        record_delimiter: getLineBreakChar(config.lineBreak),
        escape: config.quote,
        quoted: true
      });
      
      stringifier.on('readable', function() {
        let row;
        while ((row = stringifier.read()) !== null) {
          records.push(row);
        }
      });
      
      stringifier.on('error', function(err) {
        reject(new Error(`CSV書き込みエラー: ${err.message}`));
      });
      
      stringifier.on('end', function() {
        resolve();
      });
    });
    
    const content = records.join('');
    const buffer = iconv.encode(content, config.encoding);
    fs.writeFileSync(config.path, buffer);
  } catch (error) {
    throw new Error(`CSV変換エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}