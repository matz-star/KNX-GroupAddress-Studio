import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('knxStudio', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },

  exportEts6Csv: (csvContent: string) =>
    ipcRenderer.invoke('export-ets6-csv', csvContent) as Promise<{
      ok: boolean;
      canceled?: boolean;
      filePath?: string;
    }>,
});