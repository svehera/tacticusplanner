/// <reference types="vitest/config" />
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteTsconfigPaths from 'vite-tsconfig-paths';

import { main } from './src/data/onslaught/regenerate-onslaught-data';

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '/',
    envDir: 'environments',
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['babel-plugin-react-compiler', '@emotion/babel-plugin'],
            },
        }),
        viteTsconfigPaths(),
        legacy({
            targets: ['defaults', 'not IE 11'],
        }),
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
        {
            name: 'generate-onslaught-data',
            buildStart: () => main(),
        },
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
            '@': '/src',
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: ['node_modules/', 'src/setupTests.ts'],
        },
    },
});
