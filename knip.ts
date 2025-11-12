import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    compilers: {
        // https://github.com/webpro-nl/knip/issues/1008#issuecomment-3207756199
        css: (text: string) => [...text.replaceAll('plugin', 'import').matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    },
    entry: ['src/fsd/0-app/index.tsx'],
    project: ['src/**/*.{js,ts,jsx,tsx,css}'],
    ignoreDependencies: ['svgo', 'sharp'], // see https://github.com/FatehAK/vite-plugin-image-optimizer#installation
};

export default config;
