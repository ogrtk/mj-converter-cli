export interface FileConfig {
  path: string;
  encoding: string;
  lineBreak: 'crlf' | 'lf' | 'cr';
  quote: string;
  hasHeader: boolean;
}

export interface ConversionConfig {
  input: FileConfig;
  output: FileConfig;
  conversionTable: string;
  targetColumns: number[];
  missingCharacterHandling: 'error' | 'skip' | 'warn';
}

export interface AppConfig {
  conversion: ConversionConfig;
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    output: 'console' | 'file';
    logFile?: string;
  };
}