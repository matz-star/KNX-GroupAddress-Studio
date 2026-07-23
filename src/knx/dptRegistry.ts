export interface KnxDptOption {
  value: string;
  label: string;
}

/**
 * Canonical high-usage KNX DPT names.
 * (You can keep extending this map over time.)
 */
const CANONICAL_DPTS: KnxDptOption[] = [
  // 1-bit
  { value: '1.001', label: '1.001 - Switch' },
  { value: '1.002', label: '1.002 - Boolean' },
  { value: '1.003', label: '1.003 - Enable' },
  { value: '1.004', label: '1.004 - Ramp' },
  { value: '1.005', label: '1.005 - Alarm' },
  { value: '1.006', label: '1.006 - Binary Value' },
  { value: '1.007', label: '1.007 - Step' },
  { value: '1.008', label: '1.008 - Up/Down' },
  { value: '1.009', label: '1.009 - Open/Close' },
  { value: '1.010', label: '1.010 - Start' },
  { value: '1.011', label: '1.011 - State' },
  { value: '1.012', label: '1.012 - Invert' },
  { value: '1.013', label: '1.013 - Dim Send Style' },
  { value: '1.014', label: '1.014 - Input Source' },
  { value: '1.015', label: '1.015 - Reset' },
  { value: '1.016', label: '1.016 - Acknowledge' },
  { value: '1.017', label: '1.017 - Trigger' },
  { value: '1.018', label: '1.018 - Occupancy' },
  { value: '1.019', label: '1.019 - Window/Door' },

  // 2-bit controlled
  { value: '2.001', label: '2.001 - Switch Control' },
  { value: '2.002', label: '2.002 - Boolean Control' },
  { value: '2.003', label: '2.003 - Enable Control' },
  { value: '2.004', label: '2.004 - Ramp Control' },
  { value: '2.005', label: '2.005 - Alarm Control' },
  { value: '2.006', label: '2.006 - Binary Control' },
  { value: '2.007', label: '2.007 - Step Control' },
  { value: '2.008', label: '2.008 - Direction 1 Control' },

  // 4-bit relative
  { value: '3.007', label: '3.007 - Control Dimming' },
  { value: '3.008', label: '3.008 - Control Blinds' },

  // Character
  { value: '4.001', label: '4.001 - Character (ASCII)' },
  { value: '4.002', label: '4.002 - Character (ISO-8859-1)' },

  // 8-bit unsigned
  { value: '5.001', label: '5.001 - Scaling (%)' },
  { value: '5.003', label: '5.003 - Angle (°)' },
  { value: '5.004', label: '5.004 - Percent (0..255)' },
  { value: '5.005', label: '5.005 - Decimal Factor' },
  { value: '5.006', label: '5.006 - Tariff' },
  { value: '5.010', label: '5.010 - Unsigned Count' },

  // 8-bit signed
  { value: '6.001', label: '6.001 - Percent (8-bit signed)' },
  { value: '6.010', label: '6.010 - Signed Count' },

  // 16-bit unsigned
  { value: '7.001', label: '7.001 - Pulses' },
  { value: '7.002', label: '7.002 - Time Period (ms)' },
  { value: '7.003', label: '7.003 - Time Period (10 ms)' },
  { value: '7.004', label: '7.004 - Time Period (100 ms)' },
  { value: '7.005', label: '7.005 - Time Period (s)' },
  { value: '7.006', label: '7.006 - Time Period (min)' },
  { value: '7.007', label: '7.007 - Time Period (h)' },
  { value: '7.012', label: '7.012 - Value 2 Ucount' },
  { value: '7.013', label: '7.013 - Reactive Energy' },

  // 16-bit signed
  { value: '8.001', label: '8.001 - Pulses Difference' },
  { value: '8.002', label: '8.002 - Time Lag (ms)' },
  { value: '8.003', label: '8.003 - Time Lag (10 ms)' },
  { value: '8.004', label: '8.004 - Time Lag (100 ms)' },
  { value: '8.005', label: '8.005 - Time Lag (s)' },
  { value: '8.006', label: '8.006 - Time Lag (min)' },
  { value: '8.007', label: '8.007 - Time Lag (h)' },

  // 2-byte float
  { value: '9.001', label: '9.001 - Temperature (°C)' },
  { value: '9.002', label: '9.002 - Temperature Difference (K)' },
  { value: '9.003', label: '9.003 - Temperature Gradient (K/h)' },
  { value: '9.004', label: '9.004 - Illuminance (lx)' },
  { value: '9.005', label: '9.005 - Wind Speed (m/s)' },
  { value: '9.006', label: '9.006 - Pressure (Pa)' },
  { value: '9.007', label: '9.007 - Humidity (%)' },
  { value: '9.008', label: '9.008 - Air Quality (ppm)' },
  { value: '9.010', label: '9.010 - Time (s)' },
  { value: '9.011', label: '9.011 - Time (ms)' },
  { value: '9.020', label: '9.020 - Voltage (mV)' },
  { value: '9.021', label: '9.021 - Current (mA)' },
  { value: '9.024', label: '9.024 - Power (kW)' },
  { value: '9.025', label: '9.025 - Volume Flow (l/h)' },
  { value: '9.026', label: '9.026 - Rain Amount (l/m²)' },
  { value: '9.027', label: '9.027 - Temperature (°F)' },
  { value: '9.028', label: '9.028 - Wind Speed (km/h)' },

  // Time/Date
  { value: '10.001', label: '10.001 - Time of Day' },
  { value: '11.001', label: '11.001 - Date' },

  // 32-bit unsigned/signed
  { value: '12.001', label: '12.001 - Unsigned Count (32-bit)' },
  { value: '13.001', label: '13.001 - Signed Count (32-bit)' },
  { value: '13.010', label: '13.010 - Active Energy (Wh)' },
  { value: '13.013', label: '13.013 - Active Energy (kWh)' },

  // 32-bit float
  { value: '14.007', label: '14.007 - Angle (°)' },
  { value: '14.019', label: '14.019 - Electric Current (A)' },
  { value: '14.027', label: '14.027 - Power (W)' },
  { value: '14.033', label: '14.033 - Frequency (Hz)' },
  { value: '14.056', label: '14.056 - Temperature (°C)' },
  { value: '14.068', label: '14.068 - Pressure (Pa)' },

  // String / scene
  { value: '16.000', label: '16.000 - ASCII String' },
  { value: '16.001', label: '16.001 - ISO-8859-1 String' },
  { value: '17.001', label: '17.001 - Scene Number' },
  { value: '18.001', label: '18.001 - Scene Control' },
  { value: '19.001', label: '19.001 - Date with Time' },

  // HVAC/Application
  { value: '20.102', label: '20.102 - HVAC Mode' },
  { value: '20.105', label: '20.105 - HVAC Contr Mode' },

  // Color
  { value: '232.600', label: '232.600 - RGB Color' },
  { value: '251.600', label: '251.600 - RGBW Color' },
];

const pad3 = (n: number) => n.toString().padStart(3, '0');

const makeRange = (
  main: number,
  from: number,
  to: number,
  title: string
): KnxDptOption[] => {
  const out: KnxDptOption[] = [];
  for (let i = from; i <= to; i++) {
    const code = `${main}.${pad3(i)}`;
    out.push({ value: code, label: `${code} - ${title} ${pad3(i)}` });
  }
  return out;
};

const FALLBACK_RANGES: KnxDptOption[] = [
  makeRange(1, 1, 255, '1-bit'),
  makeRange(2, 1, 255, '2-bit controlled'),
  makeRange(3, 1, 255, '4-bit relative'),
  makeRange(4, 1, 255, 'Character'),
  makeRange(5, 1, 255, '8-bit unsigned'),
  makeRange(6, 1, 255, '8-bit signed'),
  makeRange(7, 1, 255, '16-bit unsigned'),
  makeRange(8, 1, 255, '16-bit signed'),
  makeRange(9, 1, 255, '2-byte float'),
  makeRange(10, 1, 255, 'Time'),
  makeRange(11, 1, 255, 'Date'),
  makeRange(12, 1, 255, '32-bit unsigned'),
  makeRange(13, 1, 255, '32-bit signed'),
  makeRange(14, 0, 255, '32-bit float'),
  makeRange(16, 0, 255, 'String'),
  makeRange(17, 0, 255, 'Scene'),
  makeRange(18, 0, 255, 'Scene control'),
  makeRange(19, 0, 255, 'DateTime'),
  makeRange(20, 0, 255, 'HVAC/Application'),
  makeRange(21, 0, 255, 'Bitset'),
  makeRange(22, 0, 255, 'Bitset2'),
  makeRange(232, 0, 999, 'Color'),
  makeRange(251, 0, 999, 'Color (extended)'),
].flat();

const byCode = new Map<string, KnxDptOption>();
for (const dpt of CANONICAL_DPTS) byCode.set(dpt.value, dpt);
for (const dpt of FALLBACK_RANGES) {
  if (!byCode.has(dpt.value)) byCode.set(dpt.value, dpt);
}

export const KNX_DPT_OPTIONS: KnxDptOption[] = Array.from(byCode.values()).sort((a, b) =>
  a.value.localeCompare(b.value, undefined, { numeric: true })
);
