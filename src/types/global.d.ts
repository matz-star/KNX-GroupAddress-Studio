export {};

declare global {
  interface Window {
    knxStudio: {
      platform: string;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
      exportEts6Csv: (csvContent: string) => Promise<{
        ok: boolean;
        canceled?: boolean;
        filePath?: string;
      }>;
    };
  }
}