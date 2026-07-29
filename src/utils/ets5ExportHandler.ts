import { GroupAddress } from '../types/GroupAddress';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const parseAddress = (address: string): [number, number, number] | null => {
  const parts = address.trim().split('/').map(Number);
  if (parts.length !== 3) return null;
  const [main, middle, sub] = parts;
  if (
    Number.isNaN(main) || Number.isNaN(middle) || Number.isNaN(sub) ||
    main < 0 || main > 31 || middle < 0 || middle > 7 || sub < 0 || sub > 255
  ) return null;
  return [main, middle, sub];
};

const toGaInteger = (main: number, middle: number, sub: number): number =>
  (main << 11) | (middle << 8) | sub;

const dptToDpst = (dpt: string): string => {
  const m = dpt.trim().match(/^(\d+)\.(\d{3})$/);
  if (!m) return '';
  return `DPST-${Number(m[1])}-${Number(m[2])}`;
};

export const downloadGroupAddressesEts5Xml = (
  addresses: GroupAddress[],
  projectName: string
) => {
  const normalized = addresses
    .map((item) => {
      const parsed = parseAddress(item.address);
      if (!parsed) return null;
      const [main, middle, sub] = parsed;
      return {
        ...item,
        main,
        middle,
        sub,
        dpst: dptToDpst(item.dpt),
        value: toGaInteger(main, middle, sub),
      };
    })
    .filter(Boolean) as Array<GroupAddress & {
      main: number;
      middle: number;
      sub: number;
      dpst: string;
      value: number;
    }>;

  const grouped = new Map<number, Map<number, typeof normalized>>();
  for (const ga of normalized) {
    if (!grouped.has(ga.main)) grouped.set(ga.main, new Map());
    const byMiddle = grouped.get(ga.main)!;
    if (!byMiddle.has(ga.middle)) byMiddle.set(ga.middle, []);
    byMiddle.get(ga.middle)!.push(ga);
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8" standalone="yes"?>');
  lines.push('<GroupAddress-Export xmlns="http://knx.org/xml/ga-export/01">');

  for (const main of Array.from(grouped.keys()).sort((a, b) => a - b)) {
    const mainStart = main << 11;
    const mainEnd = mainStart + 2047;

    lines.push(
      `  <GroupRange Name="${escapeXml('Generated main group')}" RangeStart="${mainStart}" RangeEnd="${mainEnd}">`
    );

    const middleMap = grouped.get(main)!;
    for (const middle of Array.from(middleMap.keys()).sort((a, b) => a - b)) {
      const middleStart = (main << 11) | (middle << 8);
      const middleEnd = middleStart + 255;

      lines.push(
        `    <GroupRange Name="${escapeXml('Generated middle group')}" RangeStart="${middleStart}" RangeEnd="${middleEnd}">`
      );

      const items = middleMap.get(middle)!.sort((a, b) => a.sub - b.sub);
      for (const item of items) {
        lines.push(
          `      <GroupAddress Name="${escapeXml(item.name)}" Address="${escapeXml(item.address)}" DPTs="${escapeXml(item.dpst)}" />`
        );
      }

      lines.push('    </GroupRange>');
    }

    lines.push('  </GroupRange>');
  }

  lines.push('</GroupAddress-Export>');
  lines.push('');

  const xml = lines.join('\n');
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });

  const safeName = (projectName || 'KNX Project').replace(/[<>:"/\\|?*]+/g, '_');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName}-ETS5.xml`;
  a.click();
  URL.revokeObjectURL(a.href);
};