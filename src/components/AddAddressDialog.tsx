import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DPTType, GroupAddress } from '../types/GroupAddress';
import { KNX_DPT_OPTIONS } from '../knx/dptRegistry';

type AddressFormValue = Omit<GroupAddress, 'id'>;

type AddAddressDialogProps = {
  open: boolean;
  initialValue: GroupAddress | null;
  onClose: () => void;
  onSave: (value: AddressFormValue, closeAfterSave?: boolean) => void;
};

const COMMON_DPT_CODES = new Set([
  '1.001', '1.002', '3.007', '3.008', '5.001', '5.003', '6.001', '7.001',
  '8.001', '9.001', '9.004', '9.005', '9.006', '9.007', '10.001', '11.001',
  '12.001', '13.001', '14.019', '14.027', '14.056', '16.001', '17.001',
  '18.001', '19.001', '20.102', '232.600',
]);

const ALL_DPT_OPTIONS: DPTType[] = KNX_DPT_OPTIONS.map((option) => ({
  code: option.value,
  label: option.label,
}));

const COMMON_DPT_OPTIONS: DPTType[] = ALL_DPT_OPTIONS.filter((option) =>
  COMMON_DPT_CODES.has(option.code)
);

const NAME_SUFFIXES = [
  'Till/Från',
  'Till/Från Status',
  'Dim',
  'Ljusvärde',
  'Ljusv.Status',
  'ÄR',
  'BÖR',
  'BÖR Status',
  'Styr',
  'Downl.',
  'Väggbel',
  'Lampett',
  'Pendel',
  'Nisch',
  'Tak Pendel',
  'LU Tak',
  'LU Fönster',
  'Styrda Uttag',
] as const;

const DIMMER_SUFFIXES = [
  { suffix: 'Till/Från', dpt: '1.001', offset: 0 },
  { suffix: 'Till/Från Status', dpt: '1.002', offset: 1 },
  { suffix: 'Dim', dpt: '3.007', offset: 2 },
  { suffix: 'Ljusvärde', dpt: '5.001', offset: 3 },
  { suffix: 'Ljusv.Status', dpt: '5.001', offset: 4 },
] as const;

const TUNABLE_WHITE_EXTRA_SUFFIXES = [
  { suffix: 'Absolut Färgtemp', dpt: '7.600', offset: 5 },
  { suffix: 'Absolut Färgtemp.Status', dpt: '7.600', offset: 6 },
  { suffix: 'Färgtemp, Dim', dpt: '3.007', offset: 7 },
  { suffix: 'Res', dpt: '1.001', offset: 8 },
  { suffix: 'Res', dpt: '1.001', offset: 9 },
] as const;

const RTC_SUFFIXES = [
  { suffix: 'ÄR', dpt: '9.001', offset: 0 },
  { suffix: 'BÖR', dpt: '9.001', offset: 1 },
  { suffix: 'BÖR Status', dpt: '6.010', offset: 2 },
  { suffix: 'Driftläge', dpt: '20.102', offset: 3 },
  { suffix: 'Styr Värme', dpt: '5.001', offset: 4 },
  { suffix: 'Status Värme', dpt: '5.001', offset: 5 },
  { suffix: 'Styr Kyla', dpt: '5.001', offset: 6 },
  { suffix: 'Status Kyla', dpt: '5.001', offset: 7 },
  { suffix: 'Res', dpt: '5.001', offset: 8 },
  { suffix: 'Res', dpt: '5.001', offset: 9 },
] as const;

const MARKIS_GARDIN_SUFFIXES = [
  { suffix: 'Upp/Ner', dpt: '1.008', offset: 0 },
  { suffix: 'Steg/Stop', dpt: '1.007', offset: 1 },
] as const;

const emptyFormValue: AddressFormValue = {
  address: '',
  name: '',
  description: '',
  dpt: '1.001',
  comment: '',
};

const GROUP_ADDRESS_PATTERN =
  /^(?:[0-9]|[12][0-9]|3[01])\/(?:[0-7])\/(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

const dptFamily = (code: string): string => {
  const main = code.split('.')[0];
  return `DPT ${main}`;
};

const splitKnxAddress = (address: string): [number, number, number] | null => {
  const parts = address.trim().split('/');
  if (parts.length !== 3) return null;

  const main = Number(parts[0]);
  const middle = Number(parts[1]);
  const sub = Number(parts[2]);

  if (
    Number.isNaN(main) ||
    Number.isNaN(middle) ||
    Number.isNaN(sub) ||
    main < 0 ||
    main > 31 ||
    middle < 0 ||
    middle > 7 ||
    sub < 0 ||
    sub > 255
  ) {
    return null;
  }

  return [main, middle, sub];
};

const formatKnxAddress = (main: number, middle: number, sub: number): string =>
  `${main}/${middle}/${sub}`;

const addSuffixToName = (baseName: string, suffix: string): string => {
  const trimmed = baseName.trim();
  if (!trimmed) return suffix;
  if (trimmed.endsWith(suffix)) return trimmed;
  return `${trimmed}, ${suffix}`;
};

const incrementAddress = (address: string): string => {
  const parsed = splitKnxAddress(address);
  if (!parsed) return address;

  const [main, middle, sub] = parsed;
  let nextMain = main;
  let nextMiddle = middle;
  let nextSub = sub + 1;

  if (nextSub > 255) {
    nextSub = 0;
    nextMiddle += 1;
    if (nextMiddle > 7) {
      nextMiddle = 0;
      nextMain += 1;
      if (nextMain > 31) return '31/7/255';
    }
  }

  return formatKnxAddress(nextMain, nextMiddle, nextSub);
};

const AddAddressDialog = ({
  open,
  initialValue,
  onClose,
  onSave,
}: AddAddressDialogProps) => {
  const [value, setValue] = useState<AddressFormValue>(emptyFormValue);
  const [submitted, setSubmitted] = useState(false);
  const [showAllDpts, setShowAllDpts] = useState(false);

  useEffect(() => {
    if (!open) return;

    setValue(
      initialValue
        ? {
            address: initialValue.address,
            name: initialValue.name,
            description: initialValue.description,
            dpt: initialValue.dpt,
            comment: initialValue.comment,
          }
        : emptyFormValue
    );
    setSubmitted(false);
  }, [open, initialValue?.id]);

  const visibleDptOptions = useMemo(
    () => (showAllDpts ? ALL_DPT_OPTIONS : COMMON_DPT_OPTIONS),
    [showAllDpts]
  );

  const selectedDptOption = useMemo(
    () =>
      visibleDptOptions.find((option) => option.code === value.dpt) ??
      ALL_DPT_OPTIONS.find((option) => option.code === value.dpt) ??
      null,
    [value.dpt, visibleDptOptions]
  );

  const errors = useMemo(
    () => ({
      address:
        !value.address.trim()
          ? 'Address is required.'
          : !GROUP_ADDRESS_PATTERN.test(value.address.trim())
            ? 'Use KNX format X/Y/Z (0-31/0-7/0-255).'
            : '',
      name: value.name.trim() ? '' : 'Name is required.',
      dpt: /^\d+\.\d{3}$/.test(value.dpt.trim()) ? '' : 'Use DPT format X.XXX.',
    }),
    [value.address, value.name, value.dpt]
  );

  const hasErrors = Boolean(errors.address || errors.name || errors.dpt);

  const payloadFromValue = (): AddressFormValue => ({
    address: value.address.trim(),
    name: value.name.trim(),
    description: value.description.trim(),
    dpt: value.dpt.trim(),
    comment: value.comment.trim(),
  });

  const keepOpenAndPrepareNext = (nextAddress?: string) => {
    setValue((current) => ({
      ...current,
      address: nextAddress ?? incrementAddress(current.address.trim()),
      name: current.name,
      description: '',
      comment: '',
    }));
    setSubmitted(false);
  };

  const handleAddAndNext = () => {
    setSubmitted(true);
    if (hasErrors) return;
    onSave(payloadFromValue(), false);
    keepOpenAndPrepareNext();
  };

  const handleSaveAndClose = () => {
    setSubmitted(true);
    if (hasErrors) return;
    onSave(payloadFromValue(), true);
  };

  const handleAddSwitch = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const parsed = splitKnxAddress(value.address.trim());
    if (!parsed) return;

    const [main, middle, sub] = parsed;
    const baseName = value.name.trim();

    onSave(
      {
        ...payloadFromValue(),
        address: formatKnxAddress(main, middle, sub),
        name: addSuffixToName(baseName, 'Till/Från'),
        dpt: '1.001',
      },
      false
    );

    if (sub < 255) {
      onSave(
        {
          ...payloadFromValue(),
          address: formatKnxAddress(main, middle, sub + 1),
          name: addSuffixToName(baseName, 'Till/Från Status'),
          dpt: '1.002',
        },
        false
      );
    }

    keepOpenAndPrepareNext(formatKnxAddress(main, middle, Math.min(sub + 2, 255)));
  };

  const handleAddDimmer = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const parsed = splitKnxAddress(value.address.trim());
    if (!parsed) return;

    const [main, middle, sub] = parsed;
    if (sub > 251) return;
    const baseName = value.name.trim();

    for (const item of DIMMER_SUFFIXES) {
      onSave(
        {
          ...payloadFromValue(),
          address: formatKnxAddress(main, middle, sub + item.offset),
          name: addSuffixToName(baseName, item.suffix),
          dpt: item.dpt,
        },
        false
      );
    }

    keepOpenAndPrepareNext(formatKnxAddress(main, middle, sub + 5));
  };

  const handleAddTunableWhite = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const parsed = splitKnxAddress(value.address.trim());
    if (!parsed) return;

    const [main, middle, sub] = parsed;
    if (sub > 246) return; // need 10 consecutive addresses
    const baseName = value.name.trim();

    for (const item of DIMMER_SUFFIXES) {
      onSave(
        {
          ...payloadFromValue(),
          address: formatKnxAddress(main, middle, sub + item.offset),
          name: addSuffixToName(baseName, item.suffix),
          dpt: item.dpt,
        },
        false
      );
    }

    for (const item of TUNABLE_WHITE_EXTRA_SUFFIXES) {
      onSave(
        {
          ...payloadFromValue(),
          address: formatKnxAddress(main, middle, sub + item.offset),
          name: addSuffixToName(baseName, item.suffix),
          dpt: item.dpt,
        },
        false
      );
    }

    keepOpenAndPrepareNext(formatKnxAddress(main, middle, sub + 10));
  };

  const handleAddRtc = () => {
    setSubmitted(true);
    if (hasErrors) return;
    const parsed = splitKnxAddress(value.address.trim());
    if (!parsed) return;

    const [main, middle, sub] = parsed;
    if (sub > 246) return;
    const baseName = value.name.trim();

    for (const item of RTC_SUFFIXES) {
      onSave(
        {
          ...payloadFromValue(),
          address: formatKnxAddress(main, middle, sub + item.offset),
          name: addSuffixToName(baseName, item.suffix),
          dpt: item.dpt,
        },
        false
      );
    }

    keepOpenAndPrepareNext(formatKnxAddress(main, middle, sub + 10));
  };
const handleAddMarkisGardin = () => {
  setSubmitted(true);
  if (hasErrors) return;
  const parsed = splitKnxAddress(value.address.trim());
  if (!parsed) return;

  const [main, middle, sub] = parsed;
  if (sub > 254) return; // need 2 consecutive addresses
  const baseName = value.name.trim();

  for (const item of MARKIS_GARDIN_SUFFIXES) {
    onSave(
      {
        ...payloadFromValue(),
        address: formatKnxAddress(main, middle, sub + item.offset),
        name: addSuffixToName(baseName, item.suffix),
        dpt: item.dpt,
      },
      false
    );
  }

  keepOpenAndPrepareNext(formatKnxAddress(main, middle, sub + 2));
};
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="add-address-dialog-title"
      PaperProps={{
        sx: {
          ml: { xs: 0, md: 18 },
          WebkitAppRegion: 'no-drag',
          '& .MuiInputBase-root, & input, & textarea, & button, & [role="button"]': {
            WebkitAppRegion: 'no-drag',
          },
        },
      }}
    >
      <DialogTitle
        id="add-address-dialog-title"
        sx={{
          userSelect: 'none',
          WebkitAppRegion: 'no-drag',
        }}
      >
        {initialValue ? 'Edit group address' : 'Add group address'}
      </DialogTitle>

      <DialogContent sx={{ WebkitAppRegion: 'no-drag' }}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Address"
              value={value.address}
              onKeyDown={(event) => {
                if (event.key === ' ') {
                  event.preventDefault();
                  setValue((current) => {
                    const text = current.address;
                    const slashCount = (text.match(/\//g) || []).length;
                    if (slashCount >= 2) return current;
                    if (text.endsWith('/')) return current;
                    return { ...current, address: `${text}/` };
                  });
                }
              }}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              error={submitted && Boolean(errors.address)}
              helperText={submitted ? errors.address : ' '}
              placeholder="1/0/10"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Name"
              value={value.name}
              onChange={(event) =>
                setValue((current) => ({ ...current, name: event.target.value }))
              }
              error={submitted && Boolean(errors.name)}
              helperText={submitted ? errors.name : ' '}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Quick suffix buttons (auto-append to Name):
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {NAME_SUFFIXES.map((suffix) => (
                <Button
                  key={suffix}
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setValue((current) => ({
                      ...current,
                      name: addSuffixToName(current.name, suffix),
                    }))
                  }
                >
                  {suffix}
                </Button>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={value.description}
              onChange={(event) =>
                setValue((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAllDpts}
                  onChange={(_, checked) => setShowAllDpts(checked)}
                />
              }
              label={showAllDpts ? 'Showing all DPTs' : 'Showing common DPTs'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete<DPTType, false, false, false>
              options={visibleDptOptions}
              value={selectedDptOption}
              onChange={(_, option) =>
                setValue((current) => ({ ...current, dpt: option?.code ?? '' }))
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, selected) => option.code === selected.code}
              groupBy={(option) => dptFamily(option.code)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Data point type"
                  error={submitted && Boolean(errors.dpt)}
                  helperText={submitted ? errors.dpt : ' '}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Comment"
              value={value.comment}
              onChange={(event) =>
                setValue((current) => ({ ...current, comment: event.target.value }))
              }
            />
          </Grid>

          {!initialValue && (
            <Grid item xs={12}>
              <Box sx={{ pt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" color="secondary" onClick={handleAddSwitch}>
                  Add switch (2 group addresses)
                </Button>
                <Button variant="contained" color="secondary" onClick={handleAddDimmer}>
                  Add dimmer (5 group addresses)
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAddTunableWhite}
                >
                  Add tunable white (10 group addresses)
                </Button>
                <Button variant="contained" color="secondary" onClick={handleAddRtc}>
                  Add RTC (10 group addresses)
                </Button>
                <Button variant="contained" color="secondary" onClick={handleAddMarkisGardin}>
                  Add Markis/Gardin (2 group addresses)
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, WebkitAppRegion: 'no-drag' }}>
        <Button onClick={onClose}>Close</Button>
        {!initialValue && (
          <Button onClick={handleAddAndNext} variant="outlined">
            Add & next
          </Button>
        )}
        <Button onClick={handleSaveAndClose} variant="contained">
          {initialValue ? 'Save changes' : 'Add & close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAddressDialog;