/**
 * IVS（Ideographic Variation Sequence）を含む文字列を適切に1文字単位に分割する
 * Node.js 22のIntl.Segmenterを使用して正確な文字境界検出を行う
 */
export function splitCharacters(text: string): string[] {
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), segment => segment.segment);
}

/**
 * IVSを含む文字列の正確な文字数をカウント
 */
export function countCharacters(text: string): number {
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text)).length;
}

/**
 * 文字列から指定位置の1文字を取得（IVS対応）
 */
export function getCharAt(text: string, index: number): string | undefined {
  const chars = splitCharacters(text);
  return chars[index];
}

/**
 * 文字配列を文字列に結合
 */
export function joinCharacters(chars: string[]): string {
  return chars.join('');
}