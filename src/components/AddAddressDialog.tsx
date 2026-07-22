import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { DPTType, GroupAddress } from '../types/GroupAddress';

type AddressFormValue = Omit<GroupAddress, 'id'>;

type AddAddressDialogProps = {
  open: boolean;
  initialValue: GroupAddress | null;
  onClose: () => void;
  onSave: (value: AddressFormValue) => void;
};

const dptOptions: DPTType[] = [
  { code: '1.001', label: '1.001 - Switch' },
  { code: '1.002', label: '1.002 - Boolean' },
  { code: '5.001', label: '5.001 - Percentage' },
  { code: '9.001', label: '9.001 - Temperature' },
  { code: '12.001', label: '12.001 - Unsigned count' },
  { code: '16.001', label: '16.001 - Text' },
];

const emptyFormValue: AddressFormValue = {
  address: '',
  name: '',
  description: '',
  dpt: '1.001',
  comment: '',
};

const GROUP_ADDRESS_PATTERN = /^\d+\/\d+\/\d+$/;

const AddAddressDialog = ({
  open,
  initialValue,
  onClose,
  onSave,
}: AddAddressDialogProps) => {
  const [value, setValue] = useState<AddressFormValue>(emptyFormValue);
  const [submitted, setSubmitted] = useState(false);

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
    }
  }, [initialValue, open]);

  const errors = useMemo(
    () => ({
      address:
        !value.address.trim()
          ? 'Address is required.'
          : !GROUP_ADDRESS_PATTERN.test(value.address.trim())
            ? 'Use KNX format X/Y/Z.'
            : '',
      name: value.name.trim() ? '' : 'Name is required.',
      dpt: /^\d+\.\d{3}$/.test(value.dpt.trim()) ? '' : 'Use DPT format X.XXX.',
    }),
    [value.address, value.dpt, value.name]
  );

  const hasErrors = Boolean(errors.address || errors.name || errors.dpt);

  const handleSave = () => {
    setSubmitted(true);

    if (hasErrors) {
      return;
    }

    onSave({
      address: value.address.trim(),
      name: value.name.trim(),
      description: value.description.trim(),
      dpt: value.dpt.trim(),
      comment: value.comment.trim(),
    });
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
                setValue((current) => ({ ...current, address: event.target.value }))
              }
              error={submitted && Boolean(errors.address)}
              helperText={submitted ? errors.address : ' '}
              placeholder="1/0/1"
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Data point type"
              value={value.dpt}
              onChange={(event) =>
                setValue((current) => ({ ...current, dpt: event.target.value }))
              }
              error={submitted && Boolean(errors.dpt)}
              helperText={submitted ? errors.dpt : ' '}
            >
              {dptOptions.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {initialValue ? 'Save changes' : 'Add address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAddressDialog;
