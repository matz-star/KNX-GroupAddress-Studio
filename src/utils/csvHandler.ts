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
const DPST_PATTERN = /^DPST-(\d+)-(\d+)$/i;
const DEFAULT_DPT = '1.001';

const escapeFilenamePart = (value: string) =>
  value.trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'KNX-Project';

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read the selected CSV file.'));
    reader.readAsText(file, 'utf-8');
  });

const normalizeDpt = (value: string) => {
  const dpt = (value ?? '').trim();
  return DPT_PATTERN.test(dpt) ? dpt : DEFAULT_DPT;
};

const dptToDpst = (dpt: string) => {
  const value = normalizeDpt(dpt);
  const match = /^(\d+)\.(\d{3})$/.exec(value);
  if (!match) return 'DPST-1-1';
  const main = Number(match[1]);
  const sub = Number(match[2]);
  return `DPST-${main}-${sub}`;
};

const dpstToDpt = (dpst: string) => {
  const value = (dpst ?? '').trim();
  const match = DPST_PATTERN.exec(value);
  if (!match) return DEFAULT_DPT;
  const main = match[1];
  const sub = String(Number(match[2])).padStart(3, '0');
  return `${main}.${sub}`;
};

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

  const headerParse = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (headerParse.errors.length) {
    throw new Error(headerParse.errors[0].message);
  }

  const headers = headerParse.meta.fields ?? [];
  const hasAppHeaders = REQUIRED_HEADERS.every((header) => headers.includes(header));

  if (hasAppHeaders) {
    const seenAddresses = new Set<string>();
    const addresses: GroupAddress[] = [];
    const errors: string[] = [];

    headerParse.data.forEach((row, index) => {
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
  }

  const rawParse = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  if (rawParse.errors.length) {
    throw new Error(rawParse.errors[0].message);
  }

  const seenAddresses = new Set<string>();
  const addresses: GroupAddress[] = [];
  const errors: string[] = [];

  rawParse.data.forEach((cols, idx) => {
    const rowNumber = idx + 1;

    const c0 = (cols[0] ?? '').trim();
    const c1 = (cols[1] ?? '').trim();
    const c2 = (cols[2] ?? '').trim();
    const c3 = (cols[3] ?? '').trim();
    const c7 = (cols[7] ?? '').trim();

    if (c0.toLowerCase() === 'address' || c0.toLowerCase() === 'group address') {
      return;
    }

    if (GROUP_ADDRESS_PATTERN.test(c0)) {
      const address = c0;
      const name = c1;
      const dpt = normalizeDpt(c2);

      if (!name) {
        errors.push(`Row ${rowNumber}: name is required.`);
        return;
      }

      if (seenAddresses.has(address)) {
        errors.push(`Row ${rowNumber}: duplicate address "${address}" in import file.`);
        return;
      }

      seenAddresses.add(address);
      addresses.push({
        id: '',
        address,
        name,
        description: '',
        dpt,
        comment: '',
      });
      return;
    }

    if (GROUP_ADDRESS_PATTERN.test(c3) && c2) {
      const address = c3;
      const name = c2;
      const dpt = DPST_PATTERN.test(c7) ? dpstToDpt(c7) : DEFAULT_DPT;

      if (seenAddresses.has(address)) {
        errors.push(`Row ${rowNumber}: duplicate address "${address}" in import file.`);
        return;
      }

      seenAddresses.add(address);
      addresses.push({
        id: '',
        address,
        name,
        description: '',
        dpt,
        comment: '',
      });
    }
  });

  if (!addresses.length) {
    throw new Error(
      'Unsupported CSV format. Expected app CSV headers, ETS6 3-col, or ETS6 tree export.'
    );
  }

  return { addresses, errors };
};

const downloadTextFileBrowser = (filename: string, content: string, withBom = false) => {
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

const saveCsv = async (filename: string, content: string, withBom = false) => {
  const BOM = '\uFEFF';
  const data = withBom ? BOM + content : content;

  const electronExport = window.knxStudio?.exportEts6Csv;
  if (typeof electronExport === 'function') {
    const result = await electronExport(data);
    if (!result?.ok && !result?.canceled) {
      throw new Error('Failed to save CSV file.');
    }
    return;
  }

  downloadTextFileBrowser(filename, content, withBom);
};

// Backward compatibility
export const downloadGroupAddressesCsv = async (
  addresses: GroupAddress[],
  projectName: string
) => {
  await downloadGroupAddressesEtsCsv(addresses, projectName);
};

/**
 * ETS6 3-column CSV:
 * "0/0/1","Name","1.001"
 */
export const downloadGroupAddressesEtsCsv = async (
  addresses: GroupAddress[],
  projectName: string
) => {
  const q = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines: string[] = [];
  for (const a of addresses) {
    const address = (a.address ?? '').trim();
    const name = (a.name ?? '').trim();
    const dpt = normalizeDpt(a.dpt ?? '');

    if (!address || !name) continue;
    lines.push([q(address), q(name), q(dpt)].join(','));
  }

  const csv = lines.join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  await saveCsv(`${escapeFilenamePart(projectName)}_${date}_ETS6_3col.csv`, csv, true);
};

/**
 * ETS6 tree-style CSV (9 columns), without project/root row.
 */
export const downloadGroupAddressesEtsTreeCsv = async (
  addresses: GroupAddress[],
  projectName: string,
  middleGroupName?: string
) => {
  const q = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const manualGroupName = (middleGroupName ?? '').trim();

  const rows: string[] = [];
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

    if (manualGroupName) {
      rows.push(
        [q(''), q(manualGroupName), q(''), q(`${main}/${middle}/-`), q(''), q(''), q(''), q(''), q('Auto')].join(',')
      );
    }

    const children = grouped.get(key)!;
    const sortedChildren = [...children].sort((l, r) =>
      l.address.localeCompare(r.address, undefined, { numeric: true })
    );

    for (const child of sortedChildren) {
      const dpst = dptToDpst(child.dpt ?? DEFAULT_DPT);

      rows.push(
        [
          q(''),
          q(''),
          q(child.name ?? ''),
          q(child.address ?? ''),
          q(''),
          q(''),
          q(''),
          q(dpst),
          q('Auto'),
        ].join(',')
      );
    }
  }

  const csv = rows.join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  await saveCsv(`${escapeFilenamePart(projectName)}_${date}_ETS6_tree.csv`, csv, true);
};

export const promptAndDownloadGroupAddressesEtsTreeCsv = async (
  addresses: GroupAddress[],
  projectName: string
): Promise<boolean> => {
  const input = window.prompt(
    'Enter middle-group name for ETS6 tree export.\nLeave empty to skip middle-group rows:',
    ''
  );

  if (input === null) {
    return false;
  }

  await downloadGroupAddressesEtsTreeCsv(addresses, projectName, input);
  return true;
};