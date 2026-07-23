import Papa from 'papaparse';
import { GroupAddress } from '../types/GroupAddress';

type CsvRow = Record<string, string>;
type ValidationResult =
  | { error: string }
  | {
      address: GroupAddress;
    };

const REQUIRED_HEADERS = ['Address', 'Name', 'Description', 'DataPointType', 'Comment'];
const GROUP_ADDRESS_PATTERN = /^\d+\/\d+\/\d+$/;
const DPT_PATTERN = /^\d+\.\d{3}$/;

const escapeFilenamePart = (value: string) =>
  value.trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'KNX-Project';

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read the selected CSV file.'));
    reader.readAsText(file, 'utf-8');
  });

const validateRow = (row: CsvRow, rowNumber: number): ValidationResult => {
  const address = row.Address?.trim() ?? '';
  const name = row.Name?.trim() ?? '';
  const description = row.Description?.trim() ?? '';
  const dpt = row.DataPointType?.trim() ?? '';
  const comment = row.Comment?.trim() ?? '';

  if (!address || !GROUP_ADDRESS_PATTERN.test(address)) {
    return { error: `Row ${rowNumber}: invalid KNX group address "${address}".` };
  }

  if (!name) {
    return { error: `Row ${rowNumber}: name is required.` };
  }

  if (!dpt || !DPT_PATTERN.test(dpt)) {
    return { error: `Row ${rowNumber}: invalid DPT "${dpt}".` };
  }

  return {
    address: {
      id: '',
      address,
      name,
      description,
      dpt,
      comment,
    } satisfies GroupAddress,
  };
};

export const parseGroupAddressesCsv = async (file: File) => {
  const csvText = await readFileAsText(file);
  const parseResult = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length) {
    throw new Error(parseResult.errors[0].message);
  }

  const headers = parseResult.meta.fields ?? [];
  const hasAllHeaders = REQUIRED_HEADERS.every((header) => headers.includes(header));

  if (!hasAllHeaders) {
    throw new Error(`Invalid CSV headers. Expected: ${REQUIRED_HEADERS.join(', ')}.`);
  }

  const seenAddresses = new Set<string>();
  const addresses: GroupAddress[] = [];
  const errors: string[] = [];

  parseResult.data.forEach((row, index) => {
    const result = validateRow(row, index + 2);

    if ('error' in result) {
      errors.push(result.error);
      return;
    }

    if (seenAddresses.has(result.address.address)) {
      errors.push(`Row ${index + 2}: duplicate address "${result.address.address}" in import file.`);
      return;
    }

    seenAddresses.add(result.address.address);
    addresses.push(result.address);
  });

  return { addresses, errors };
};

const downloadTextFileNoBom = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' }); // no BOM
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Keep this for compatibility if other code imports it.
export const downloadGroupAddressesCsv = (
  addresses: GroupAddress[],
  projectName: string
) => {
  downloadGroupAddressesEtsCsv(addresses, projectName);
};

/**
 * ETS6 expected output (CSV-only import):
 * "0/0/1","Name","1.001"
 * "0/0/2","Name 2","1.001"
 */
export const downloadGroupAddressesEtsCsv = (
  addresses: GroupAddress[],
  projectName: string
) => {
  const q = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines: string[] = [];

  for (const a of addresses) {
    const address = (a.address ?? '').trim();
    const name = (a.name ?? '').trim();
    const dpt = (a.dpt ?? '').trim();

    if (!address || !name || !dpt) continue;

    // strict 3-column row
    lines.push([q(address), q(name), q(dpt)].join(','));
  }

  const csv = lines.join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadTextFileNoBom(`${escapeFilenamePart(projectName)}_${date}_ETS6.csv`, csv);
};