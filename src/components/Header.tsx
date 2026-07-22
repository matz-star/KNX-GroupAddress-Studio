import { ChangeEvent, useRef } from 'react';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { AppBar, Box, Button, Stack, TextField, Toolbar, Typography } from '@mui/material';

type HeaderProps = {
  projectName: string;
  onProjectNameChange: (projectName: string) => void;
  onImportFile: (file: File) => void | Promise<void>;
  onExport: () => void;
};

const Header = ({
  projectName,
  onProjectNameChange,
  onImportFile,
  onExport,
}: HeaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      await onImportFile(file);
    }

    event.target.value = '';
  };

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
        <Box sx={{ flexGrow: 1, minWidth: 240 }}>
          <Typography variant="h5">KNX Group Address Studio</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Professional KNX group address management for desktop workflows
          </Typography>
        </Box>
        <TextField
          size="small"
          label="Project name"
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          InputProps={{
            startAdornment: <DriveFileRenameOutlineIcon sx={{ mr: 1 }} fontSize="small" />,
          }}
          sx={{
            minWidth: { xs: '100%', sm: 220 },
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            '& .MuiInputBase-root': { color: 'common.white' },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.25)',
            },
          }}
        />
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CloudUploadIcon />}
            onClick={handleImportClick}
          >
            Import CSV
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CloudDownloadIcon />}
            onClick={onExport}
          >
            Export CSV
          </Button>
        </Stack>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
