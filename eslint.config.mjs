import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import * as pluginImportX from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

const FS_LAYERS = [
    'app',
    'pages',
    'widgets',
    'features',
    'entities',
    'shared',
];

const REVERSED_FS_LAYERS = [...FS_LAYERS].reverse();

export default [
    ...compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'prettier'
    ),
    pluginImportX.flatConfigs.recommended,
    pluginImportX.flatConfigs.typescript,
    {
        plugins: {
            '@typescript-eslint': typescriptEslint,
            react,
            'react-refresh': reactRefresh,
            'react-compiler': reactCompiler,
            prettier,     
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },

        settings: {
            react: {
                version: 'detect',
            },
        },

        rules: {
            quotes: [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],

            semi: ['error', 'always'],
            'object-curly-spacing': ['error', 'always'],
            '@typescript-eslint/no-explicit-any': ['warn'],
            '@typescript-eslint/no-unused-vars': ['warn'],
            'react-refresh/only-export-components': 'error',
            'react-compiler/react-compiler': 'error',
            'import-x/order': [
            2,
            {
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                pathGroupsExcludedImportTypes: ['builtin'],
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],

                // experimental features
                'newlines-between': 'always',
                pathGroups: REVERSED_FS_LAYERS.map(
                    (layer) => ({
                        pattern: `**/?(*)${layer}{,/**}`,
                        group: 'internal',
                        position: 'after',
                    }),
                ),
            },
        ],
        },
    },
];
