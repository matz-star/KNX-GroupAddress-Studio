import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from '@mui/material';
import { DPTType, GroupAddress } from '../types/GroupAddress';
import { KNX_DPT_OPTIONS } from '../knx/dptRegistry';

type AddressFormValue = Omit<GroupAddress, 'id'>;

type AddAddressDialogProps = {
  open: boolean;
  initialValue: GroupAddress | null;
  onClose: () => void;
  onSave: (value: AddressFormValue) => void;
};

const COMMON_DPT_CODES = new Set([
  '1.001',
  '1.002',
  '3.007',
  '3.008',
  '5.001',
  '5.003',
  '6.001',
  '7.001',
  '8.001',
  '9.001',
  '9.004',
  '9.005',
  '9.006',
  '9.007',
  '10.001',
  '11.001',
  '12.001',
  '13.001',
  '14.019',
  '14.027',
  '14.056',
  '16.001',
  '17.001',
  '18.001',
  '19.001',
  '20.102',
  '232.600',
]);

const ALL_DPT_OPTIONS: DPTType[] = KNX_DPT_OPTIONS.map((option) => ({
  code: option.value,
  label: option.label,
}));

const COMMON_DPT_OPTIONS: DPTType[] = ALL_DPT_OPTIONS.filter((option) =>
  COMMON_DPT_CODES.has(option.code)
);

const emptyFormValue: AddressFormValue = {
  address: '',
  name: '',
  description: '',
  dpt: '1.001',
  comment: '',
};

// Strict KNX 3-level limits: main 0-15, middle 0-15, sub 0-255
const GROUP_ADDRESS_PATTERN =
  /^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

const dptFamily = (code: string): string => {
  const main = code.split('.')[0];
  return `DPT ${main}`;
};

const normalizeGroupAddressInput = (raw: string): string => {
  // keep only digits; separators typed by user (space, -, /, .) are ignored
  const digits = raw.replace(/[^\d]/g, '');

  if (!digits) return '';

  // Heuristic: first digit = main, second = middle, rest = sub
  const main = digits.slice(0, 1);
  const middle = digits.slice(1, 2);
  const sub = digits.slice(2, 5); // cap sub to 3 digits

  if (digits.length <= 1) return main;
  if (digits.length === 2) return `${main}/${middle}`;
  return `${main}/${middle}/${sub}`;
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
    if (open) {
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
      setShowAllDpts(false);
    }
  }, [initialValue, open]);

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
            ? 'Use KNX format X/Y/Z (0-15/0-15/0-255).'
            : '',
      name: value.name.trim() ? '' : 'Name is required.',
      dpt: /^\d+\.\d{3}$/.test(value.dpt.trim()) ? '' : 'Use DPT format X.XXX.',
    }),
    [value.address, value.dpt, value.name]
  );

  const hasErrors = Boolean(errors.address || errors.name || errors.dpt);

  const payloadFromValue = (): AddressFormValue => ({
    address: value.address.trim(),
    name: value.name.trim(),
    description: value.description.trim(),
    dpt: value.dpt.trim(),
    comment: value.comment.trim(),
  });

  const resetForNext = () => {
    setValue((current) => ({
      ...emptyFormValue,
      dpt: current.dpt || emptyFormValue.dpt, // keep selected DPT for faster bulk entry
    }));
    setSubmitted(false);
  };

  const handleAddAndNext = () => {
    setSubmitted(true);
    if (hasErrors) return;

    onSave(payloadFromValue());
    resetForNext();
  };

  const handleSaveAndClose = () => {
    setSubmitted(true);
    if (hasErrors) return;

    onSave(payloadFromValue());
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialValue ? 'Edit group address' : 'Add group address'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Address"
              value={value.address}
              onChange={(event) =>
                setValue((current) => ({
                  ...current,
                  address: normalizeGroupAddressInput(event.target.value),
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
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
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
