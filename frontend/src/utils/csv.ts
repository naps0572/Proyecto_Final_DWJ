type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) return '';

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadCsv(
  filenamePrefix: string,
  headers: string[],
  rows: CsvValue[][]
) {
  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(','))
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${filenamePrefix}-${todayStamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
