import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    moduleNameMapper: {
        'src/(.*)': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.(tx|tsx)$': [
            'ts-jest',
            {
                tsconfig: './tsconfig.test.json',
            },
        ],
    },
};

export default config;
