/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_HOST: string;
    readonly VITE_FUNCTIONS_KEY: string;
    readonly VITE_GTAG: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
