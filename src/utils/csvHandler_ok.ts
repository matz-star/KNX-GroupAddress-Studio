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

const downloadTextFile = (filename: string, content: string, withBom = false) => {
  const BOM = '\uFEFF';
  const data = withBom ? BOM + content : content;
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Backward compatibility
export const downloadGroupAddressesCsv = (
  addresses: GroupAddress[],
  projectName: string
) => {
  downloadGroupAddressesEtsCsv(addresses, projectName);
};

/**
 * ETS6 3-column CSV:
 * "0/0/1","Name","1.001"
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
    lines.push([q(address), q(name), q(dpt)].join(','));
  }

  const csv = lines.join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadTextFile(`${escapeFilenamePart(projectName)}_${date}_ETS6_3col.csv`, csv, true);
};

/**
 * ETS6 tree-style CSV (9 columns), without project/root row.
 * If middleGroupName is blank, middle-group rows are omitted.
 */
export const downloadGroupAddressesEtsTreeCsv = (
  addresses: GroupAddress[],
  projectName: string,
  middleGroupName?: string
) => {
  const q = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const manualGroupName = (middleGroupName ?? '').trim();

  const rows: string[] = [];

  // Group addresses by main/middle
  const grouped = new Map<string, GroupAddress[]>();
  for (const a of addresses) {
    const addr = (a.address ?? '').trim();
    if (!GROUP_ADDRESS_PATTERN.test(addr)) continue;

    const [main, middle] = addr.split('/');
    const key = `${main}/${middle}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  const sortedGroupKeys = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  for (const key of sortedGroupKeys) {
    const [main, middle] = key.split('/');

    // Middle-group row only when user provided a label
    if (manualGroupName) {
      rows.push(
        [q(''), q(manualGroupName), q(''), q(`${main}/${middle}/-`), q(''), q(''), q(''), q(''), q('Auto')].join(',')
      );
    }

    // Leaf rows
    const children = grouped.get(key)!;
    const sortedChildren = [...children].sort((l, r) =>
      l.address.localeCompare(r.address, undefined, { numeric: true })
    );

    for (const child of sortedChildren) {
      rows.push(
        [q(''), q(''), q(child.name ?? ''), q(child.address ?? ''), q(''), q(''), q(''), q(''), q('Auto')].join(',')
      );
    }
  }

  const csv = rows.join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadTextFile(`${escapeFilenamePart(projectName)}_${date}_ETS6_tree.csv`, csv, true);
};

/**
 * Helper for UI button:
 * prompts user for middle-group name before ETS tree export.
 * - Cancel => no export
 * - Empty input => export without middle-group rows
 */
export const promptAndDownloadGroupAddressesEtsTreeCsv = (
  addresses: GroupAddress[],
  projectName: string
): boolean => {
  const input = window.prompt(
    'Enter middle-group name for ETS6 tree export.\nLeave empty to skip middle-group rows:',
    ''
  );

  if (input === null) {
    return false; // user cancelled
  }

  downloadGroupAddressesEtsTreeCsv(addresses, projectName, input);
  return true;
};