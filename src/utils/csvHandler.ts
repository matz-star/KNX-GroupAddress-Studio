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
    throw new Error(
      `Invalid CSV headers. Expected: ${REQUIRED_HEADERS.join(', ')}.`
    );
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
      errors.push(
        `Row ${index + 2}: duplicate address "${result.address.address}" in import file.`
      );
      return;
    }

    seenAddresses.add(result.address.address);
    addresses.push(result.address);
  });

  return { addresses, errors };
};

export const downloadGroupAddressesCsv = (
  addresses: GroupAddress[],
  projectName: string
) => {
  const csv = Papa.unparse(
    addresses.map((address) => ({
      Address: address.address,
      Name: address.name,
      Description: address.description,
      DataPointType: address.dpt,
      Comment: address.comment,
    }))
  );

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${escapeFilenamePart(projectName)}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
