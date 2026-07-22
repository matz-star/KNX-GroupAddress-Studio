import { ChangeEvent, MouseEvent, useMemo, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import {
  Checkbox,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { GroupAddress } from '../types/GroupAddress';

type GroupAddressTableProps = {
  addresses: GroupAddress[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (address: GroupAddress) => void;
};

const GroupAddressTable = ({
  addresses,
  selectedIds,
  onSelectionChange,
  onEdit,
}: GroupAddressTableProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredAddresses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return addresses;
    }

    return addresses.filter((address) =>
      [address.address, address.name, address.description, address.dpt, address.comment]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [addresses, search]);

  const paginatedAddresses = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAddresses.slice(start, start + rowsPerPage);
  }, [filteredAddresses, page, rowsPerPage]);

  const handleToggle = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  };

  const handleTogglePage = (event: ChangeEvent<HTMLInputElement>) => {
    if (!paginatedAddresses.length) {
      return;
    }

    if (event.target.checked) {
      const ids = Array.from(new Set([...selectedIds, ...paginatedAddresses.map((row) => row.id)]));
      onSelectionChange(ids);
      return;
    }

    onSelectionChange(
      selectedIds.filter((id) => !paginatedAddresses.some((row) => row.id === id))
    );
  };

  const pageSelectionCount = paginatedAddresses.filter((row) =>
    selectedIds.includes(row.id)
  ).length;

  return (
    <Paper sx={{ p: 2 }}>
      <TextField
        fullWidth
        label="Search group addresses"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={paginatedAddresses.length > 0 && pageSelectionCount === paginatedAddresses.length}
                  indeterminate={
                    pageSelectionCount > 0 && pageSelectionCount < paginatedAddresses.length
                  }
                  onChange={handleTogglePage}
                />
              </TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>DPT</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAddresses.length ? (
              paginatedAddresses.map((address) => {
                const selected = selectedIds.includes(address.id);

                return (
                  <TableRow
                    key={address.id}
                    hover
                    selected={selected}
                    onClick={() => handleToggle(address.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected}
                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation();
                          handleToggle(address.id);
                        }}
                      />
                    </TableCell>
                    <TableCell>{address.address}</TableCell>
                    <TableCell>{address.name}</TableCell>
                    <TableCell>{address.description || '—'}</TableCell>
                    <TableCell>{address.dpt}</TableCell>
                    <TableCell>{address.comment || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Edit ${address.address}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(address);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No group addresses match the current search.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredAddresses.length}
        page={page}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
};

export default GroupAddressTable;
