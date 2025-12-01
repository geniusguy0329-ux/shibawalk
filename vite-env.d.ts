// Removed broken reference to vite/client
// /// <reference types="vite/client" />

declare module "*.css";
declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow process.env.API_KEY to be used in TypeScript code
// This is replaced by Vite at build time
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}