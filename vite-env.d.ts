// Fixed: Removed missing reference to 'vite/client' and added manual type definitions
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare var process: {
  env: {
    API_KEY: string;
    [key: string]: any;
  }
};
