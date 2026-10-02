/**
 * CSV for spreadsheets. Text that a spreadsheet would read as a formula
 * (starting with =, +, -, @, a tab or a carriage return) is prefixed with an
 * apostrophe, so opening an export never runs anything. Numbers are written
 * as exact decimal strings and are not altered.
 *
 * @cc [label:security] safe-external-content
 * Every exported text cell MUST pass through csvCell, so editorial or EDI text
 * can never become a spreadsheet formula.
 */

export type CsvValue = string | number | boolean | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;
const DECIMAL = /^-?\d+(\.\d+)?$/;

/** One cell: neutralized, then quoted when it contains a delimiter, quote or line break. */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'string' ? value : String(value);
  // A plain decimal (including a negative one) is data, not a formula.
  if (FORMULA_START.test(text) && !DECIMAL.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A whole file: a header row and one row per record, CRLF line ends, with a byte order mark for spreadsheet apps. */
export function toCsv<T>(rows: readonly T[], columns: readonly (readonly [header: string, value: (row: T) => CsvValue])[]): string {
  const lines = [columns.map(([header]) => csvCell(header)).join(',')];
  for (const row of rows) lines.push(columns.map(([, value]) => csvCell(value(row))).join(','));
  return `\ufeff${lines.join('\r\n')}\r\n`;
}
