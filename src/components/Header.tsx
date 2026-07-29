import { ChangeEvent, useRef } from 'react';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import {
  AppBar,
  Box,
  Button,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import logo from '../assets/logo.png';

type HeaderProps = {
  projectName: string;
  onProjectNameChange: (projectName: string) => void;
  onImportFile: (file: File) => void | Promise<void>;
  onExport3Col: () => void | Promise<void>;
  onExportTree: () => void | Promise<void>;
  onExportEts5Xml: () => void;
};

const Header = ({
  projectName,
  onProjectNameChange,
  onImportFile,
  onExport3Col,
  onExportTree,
  onExportEts5Xml,
}: HeaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await onImportFile(file);
    event.target.value = '';
  };

  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar
        sx={{
          gap: 2,
          flexWrap: 'wrap',
          py: 1,
          WebkitAppRegion: 'no-drag',
          '& button, & input, & textarea, & .MuiInputBase-root, & [role="button"]': {
            WebkitAppRegion: 'no-drag',
          },
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 240,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            WebkitAppRegion: 'no-drag',
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="KNX Group Address Studio logo"
            sx={{
              height: 40,
              width: 'auto',
              maxWidth: 180,
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />
          <Box sx={{ WebkitAppRegion: 'no-drag' }}>
            <Typography variant="h5">KNX Group Address Studio</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Professional KNX group address management for desktop workflows
            </Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          label="Project name"
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <DriveFileRenameOutlineIcon sx={{ mr: 1 }} fontSize="small" />
            ),
          }}
          sx={{
            minWidth: { xs: '100%', sm: 220 },
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            WebkitAppRegion: 'no-drag',
            '& .MuiInputBase-root': {
              color: 'common.white',
              WebkitAppRegion: 'no-drag',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.25)',
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', WebkitAppRegion: 'no-drag' }}
        >
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CloudUploadIcon />}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CloudDownloadIcon />}
            onClick={() => void onExport3Col()}
          >
            Export CSV (ETS6 3-col)
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CloudDownloadIcon />}
            onClick={() => void onExportTree()}
          >
            Export CSV (ETS6 Tree)
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={onExportEts5Xml}
          >
            Export ETS5 XML
          </Button>
        </Stack>

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".csv,text/csv,.xml,application/xml,text/xml"
          onChange={handleFileChange}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;