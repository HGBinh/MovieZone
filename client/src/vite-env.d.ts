/// <reference types="vite/client" />

declare module '@emailjs/browser';

declare module 'react-icons/lib/iconBase' {
  export interface IconBaseProps {
    'sm:size'?: number;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
