import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Container, Snackbar, Stack } from '@mui/material';
import AddAddressDialog from './components/AddAddressDialog';
import ControlPanel from './components/ControlPanel';
import GroupAddressTable from './components/GroupAddressTable';
import Header from './components/Header';
import { GroupAddress } from './types/GroupAddress';
import { downloadGroupAddressesCsv, parseGroupAddressesCsv } from './utils/csvHandler';
import {
  loadGroupAddresses,
  loadProjectName,
  saveGroupAddresses,
  saveProjectName,
} from './utils/storageHandler';

type SnackbarState = {
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const defaultSnackbar: SnackbarState = {
  severity: 'info',
  message: '',
};

const createAddressId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const App = () => {
  const [projectName, setProjectName] = useState('KNX Project');
  const [addresses, setAddresses] = useState<GroupAddress[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<GroupAddress | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(defaultSnackbar);

  useEffect(() => {
    setProjectName(loadProjectName());
    setAddresses(loadGroupAddresses());
  }, []);

  useEffect(() => {
    saveProjectName(projectName);
  }, [projectName]);

  useEffect(() => {
    saveGroupAddresses(addresses);
  }, [addresses]);

  const selectedCount = selectedIds.length;

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((left, right) =>
        left.address.localeCompare(right.address, undefined, { numeric: true })
      ),
    [addresses]
  );

  const openSnackbar = (severity: SnackbarState['severity'], message: string) => {
    setSnackbar({ severity, message });
  };

  const handleAddClick = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleEditAddress = (address: GroupAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = (input: Omit<GroupAddress, 'id'>) => {
    const normalizedAddress = input.address.trim();
    const duplicate = addresses.find(
      (address) =>
        address.address === normalizedAddress &&
        address.id !== editingAddress?.id
    );

    if (duplicate) {
      openSnackbar('error', `Group address ${normalizedAddress} already exists.`);
      return;
    }

    if (editingAddress) {
      setAddresses((current) =>
        current.map((address) =>
          address.id === editingAddress.id
            ? { ...editingAddress, ...input, address: normalizedAddress }
            : address
        )
      );
      openSnackbar('success', `Updated ${normalizedAddress}.`);
    } else {
      setAddresses((current) => [
        ...current,
        { id: createAddressId(), ...input, address: normalizedAddress },
      ]);
      openSnackbar('success', `Added ${normalizedAddress}.`);
    }

    handleCloseDialog();
  };

  const handleDeleteSelected = () => {
    if (!selectedCount) {
      return;
    }

    if (!window.confirm(`Delete ${selectedCount} selected group address(es)?`)) {
      return;
    }

    setAddresses((current) =>
      current.filter((address) => !selectedIds.includes(address.id))
    );
    setSelectedIds([]);
    openSnackbar('success', `Deleted ${selectedCount} group address(es).`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const { addresses: importedAddresses, errors } =
        await parseGroupAddressesCsv(file);

      if (!importedAddresses.length && errors.length) {
        openSnackbar('error', errors[0]);
        return;
      }

      let addedCount = 0;
      let duplicateCount = 0;

      setAddresses((current) => {
        const existingByAddress = new Set(current.map((address) => address.address));
        const next = [...current];

        importedAddresses.forEach((address) => {
          if (existingByAddress.has(address.address)) {
            duplicateCount += 1;
            return;
          }

          existingByAddress.add(address.address);
          next.push({ ...address, id: createAddressId() });
          addedCount += 1;
        });

        return next;
      });

      if (!addedCount && duplicateCount) {
        openSnackbar('warning', 'All imported addresses were already present.');
        return;
      }

      const messages = [];
      messages.push(`Imported ${addedCount} group address(es).`);
      if (duplicateCount) {
        messages.push(`Skipped ${duplicateCount} duplicate(s).`);
      }
      if (errors.length) {
        messages.push(`${errors.length} invalid row(s) ignored.`);
      }
      openSnackbar('success', messages.join(' '));
    } catch (error) {
      openSnackbar(
        'error',
        error instanceof Error ? error.message : 'Failed to import CSV file.'
      );
    }
  };

  const handleExport = () => {
    if (!addresses.length) {
      openSnackbar('warning', 'Add at least one group address before exporting.');
      return;
    }

    downloadGroupAddressesCsv(sortedAddresses, projectName);
    openSnackbar('success', 'CSV export started.');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onImportFile={handleImportFile}
        onExport={handleExport}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <ControlPanel
            selectedCount={selectedCount}
            totalCount={addresses.length}
            onAdd={handleAddClick}
            onDeleteSelected={handleDeleteSelected}
          />
          <GroupAddressTable
            addresses={sortedAddresses}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={handleEditAddress}
          />
        </Stack>
      </Container>
      <AddAddressDialog
        open={dialogOpen}
        initialValue={editingAddress}
        onClose={handleCloseDialog}
        onSave={handleSaveAddress}
      />
      <Snackbar
        open={Boolean(snackbar.message)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(defaultSnackbar)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(defaultSnackbar)}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
