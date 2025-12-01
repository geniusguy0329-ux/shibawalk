// Fixed: Removed missing reference to 'vite/client' and added manual type definitions
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment NodeJS namespace if it exists to add API_KEY to ProcessEnv.
// This avoids "Cannot redeclare block-scoped variable 'process'" error.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
