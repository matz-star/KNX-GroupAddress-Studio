import { Button, Stack } from '@mui/material';
import { GroupAddress } from '../types/GroupAddress';
import {
  downloadGroupAddressesEtsCsv,
  downloadGroupAddressesEtsTreeCsv,
} from '../utils/csvHandler';

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
        Export CSV (ETS6 3-col)
      </Button>

      <Button
        variant="outlined"
        onClick={() => downloadGroupAddressesEtsTreeCsv(addresses, projectName)}
      >
        Export CSV (ETS6 Tree)
      </Button>
    </Stack>
  );
};

export default GroupAddressesToolbar;
