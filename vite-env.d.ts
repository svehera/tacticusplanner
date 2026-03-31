/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_HOST: string;
    readonly VITE_FUNCTIONS_KEY: string;
    readonly VITE_GTAG: string;
    readonly CONVEX_DEPLOYMENT: string;
    readonly VITE_CONVEX_URL: string;
    readonly VITE_CONVEX_SITE_URL: string;
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
    readonly CLERK_FRONTEND_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
