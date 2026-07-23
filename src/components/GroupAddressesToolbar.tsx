import { Button, Stack } from '@mui/material';
import { GroupAddress } from '../types/GroupAddress';
import { downloadGroupAddressesEtsCsv } from '../utils/csvHandler';

type GroupAddressesToolbarProps = {
  addresses: GroupAddress[];
  projectName: string;
};

const GroupAddressesToolbar = ({
  addresses,
  projectName,
}: GroupAddressesToolbarProps) => {
  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        onClick={() => downloadGroupAddressesEtsCsv(addresses, projectName)}
      >
        Export CSV
      </Button>
    </Stack>
  );
};

export default GroupAddressesToolbar;