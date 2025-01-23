import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import browserslistToEsbuild from 'browserslist-to-esbuild';

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '/',
    envDir: 'environments',
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['@emotion/babel-plugin'],
            },
        }),
        viteTsconfigPaths(),
        ViteImageOptimizer({
            png: {
                quality: 80,
            },
            jpeg: {
                quality: 75,
            },
            webp: {
                quality: 75,
            },
        }),
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: true,
        // this sets a default port to 3000
        port: 3000,
    },
    build: {
        target: browserslistToEsbuild(['>0.2%', 'not dead', 'not op_mini all']),
    },
    resolve: {
        alias: {
            src: '/src',
        },
    },
});
