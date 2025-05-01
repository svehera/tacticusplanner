import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
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
            boundaries,
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
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
            },
            'boundaries/elements': [
                { type: 'app', pattern: '0-app/*' },
                { type: 'pages', pattern: '1-pages/*' },
                { type: 'widgets', pattern: '2-widgets/*' },
                { type: 'features', pattern: '3-features/*' },
                { type: 'entities', pattern: '4-entities/*' },
                { type: 'shared', pattern: '5-shared/*' },
            ]
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
                'error',
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
            'boundaries/element-types': ['error', {
                default: 'disallow',
                message: '${file.type} is not allowed to import ${dependency.type}',
                rules: [
                    {
                        from: 'app',
                        allow: ['app', 'shared', 'entities', 'features', 'widgets', 'pages'],
                    },
                    {
                        from: 'pages',
                        allow: ['shared', 'entities', 'features', 'widgets'],
                    },
                    {
                        from: 'widgets',
                        allow: ['shared', 'entities', 'features'],
                    },
                    {
                        from: 'features',
                        allow: ['shared', 'entities'],
                    },
                    {
                        from: 'entities',
                        allow: ['shared'],
                    },
                    {
                        from: 'shared',
                        allow: [],
                    }
                ]
            }]
        },
    },
];
