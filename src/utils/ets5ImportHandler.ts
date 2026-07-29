import { GroupAddress } from '../types/GroupAddress';

type ImportedAddress = Omit<GroupAddress, 'id'>;

type Ets5ImportResult = {
  projectName: string;
  addresses: ImportedAddress[];
};

const GROUP_ADDRESS_PATTERN =
  /^(?:[0-9]|[12][0-9]|3[01])\/(?:[0-7])\/(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

const parseDpstToDpt = (dpst: string | null): string => {
  if (!dpst) return '1.001';
  const match = dpst.trim().match(/^DPST-(\d+)-(\d+)$/i);
  if (!match) return '1.001';

  const main = Number(match[1]);
  const sub = Number(match[2]);

  if (Number.isNaN(main) || Number.isNaN(sub)) return '1.001';
  return `${main}.${String(sub).padStart(3, '0')}`;
};

export const importGroupAddressesFromEts5Xml = async (
  file: File
): Promise<Ets5ImportResult> => {
  const xmlText = await file.text();
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format.');
  }

  const root = doc.documentElement;
  if (!root || root.localName !== 'GroupAddress-Export') {
    throw new Error('Not a valid ETS5 GroupAddress-Export XML file.');
  }

  const firstGroupRange = Array.from(root.children).find(
    (node) => node.localName === 'GroupRange'
  ) as Element | undefined;

  const projectName =
    firstGroupRange?.getAttribute('Name')?.trim() || 'Imported ETS5 Project';

  const nodes = Array.from(doc.getElementsByTagNameNS('*', 'GroupAddress'));

  const addresses: ImportedAddress[] = nodes
    .map((node) => {
      const address = (node.getAttribute('Address') || '').trim();
      if (!GROUP_ADDRESS_PATTERN.test(address)) return null;

      const name = (node.getAttribute('Name') || '').trim() || address;
      const dpt = parseDpstToDpt(node.getAttribute('DPTs'));

      return {
        address,
        name,
        dpt,
        description: '',
        comment: '',
      };
    })
    .filter((item): item is ImportedAddress => Boolean(item));

  if (!addresses.length) {
    throw new Error('No valid group addresses found in ETS5 XML.');
  }

  return { projectName, addresses };
};