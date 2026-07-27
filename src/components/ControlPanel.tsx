import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Paper, Stack, Typography } from '@mui/material';

type ControlPanelProps = {
  selectedCount: number;
  totalCount: number;
  onAdd: () => void;
  onDeleteSelected: () => void;
};

const ControlPanel = ({
  selectedCount,
  totalCount,
  onAdd,
  onDeleteSelected,
}: ControlPanelProps) => (
  <Paper sx={{ p: 2 }}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
    >
      <div>
        <Typography variant="h6">Control panel</Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount} total group address(es) • {selectedCount} selected
        </Typography>
      </div>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Add new
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDeleteSelected}
          disabled={!selectedCount}
        >
          Delete selected
        </Button>
      </Stack>
    </Stack>
  </Paper>
);

export default ControlPanel;
