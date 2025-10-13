import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    compilers: {
        // https://github.com/webpro-nl/knip/issues/1008#issuecomment-3207756199
        css: (text: string) => [...text.matchAll(/(?<=@)(import|plugin)[^;]+/g)].join('\n').replace('plugin', 'import'),
    },
    entry: ['src/fsd/0-app/index.tsx'],
    project: ['**/*.{js,ts,jsx,tsx,css}'],
};

export default config;
