import babelParser from '@babel/eslint-parser';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import noFunctionDeclareAfterReturn from 'eslint-plugin-no-function-declare-after-return';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import reactPlugin from 'eslint-plugin-react';
import reactCompiler from 'eslint-plugin-react-compiler';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylexjs from '@stylexjs/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    ignores: ['**/node_modules'],
  },

  ...compat.extends('alloy', 'alloy/react'),
  {
    files: ['**/*.js', '**/*.jsx'],

    plugins: {
      'simple-import-sort': simpleImportSort,
      'sort-keys-fix': sortKeysFix,
      'no-function-declare-after-return': noFunctionDeclareAfterReturn,
      'no-only-tests': noOnlyTests,
      '@stylexjs': stylexjs,
      'react-compiler': reactCompiler,
    },

    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        JSX: true,
        __DEV__: true,
      },

      parser: babelParser,
      ecmaVersion: 11,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          experimentalObjectRestSpread: true,
        },

        requireConfigFile: false,
      },
    },

    settings: {
      'import/resolver': {
        jsconfig: { config: 'jsconfig.json' },
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
      react: {
        version: 'detect',
      },
    },

    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Packages `react` related packages come first.
            ['^react', '^\\w', '^@hookform', '^@radix-ui'],
            // npm packages
            // Anything that starts with a letter (or digit or underscore), or `@` followed by a letter.
            // ['^\\w'],
            // Internal packages.
            ['^@store(/.*|$)'],
            ['^@components(/.*|$)'],
            ['^@ui(/.*|$)'],
            ['^@lib(/.*|$)'],
            ['^@pages(/.*|$)'],
            ['^@utils(/.*|$)'],
            ['^@hooks(/.*|$)'],
            ['^@services(/.*|$)'],
            // Side effect imports.
            ['^\\u0000'],
            // Parent imports. Put `..` last.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports. Put same-folder imports and `.` last.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports.
            ['^.+\\.?(css)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      eqeqeq: [2, 'allow-null'],
      'import/first': 2,
      'import/newline-after-import': 2,
      'import/no-duplicates': 2,
      indent: 0,
      'jsx-quotes': [2, 'prefer-double'],
      'max-len': 0,
      'no-unused-expressions': 0,

      'no-unused-vars': [
        2,
        {
          args: 'none',
        },
      ],

      '@stylexjs/valid-styles': 'error',
      '@stylexjs/no-unused': 'error',
      '@stylexjs/valid-shorthands': 'warn',
      '@stylexjs/sort-keys': 'warn',

      'no-undef': 'error', // flag undefined identifiers like `sdasdasdad`

      'react/no-did-update-set-state': 'off', // still good to disable if using React 18+

      'no-var': 2,

      'no-restricted-globals': [
        2,
        'addEventListener',
        'blur',
        'close',
        'closed',
        'confirm',
        'defaultStatus',
        'defaultstatus',
        'event',
        'external',
        'find',
        'focus',
        'frameElement',
        'frames',
        'history',
        'innerHeight',
        'innerWidth',
        'length',
        'location',
        'locationbar',
        'menubar',
        'moveBy',
        'moveTo',
        'name',
        'onblur',
        'onerror',
        'onfocus',
        'onload',
        'onresize',
        'onunload',
        'open',
        'opener',
        'opera',
        'outerHeight',
        'outerWidth',
        'pageXOffset',
        'pageYOffset',
        'parent',
        'print',
        'removeEventListener',
        'resizeBy',
        'resizeTo',
        'screen',
        'screenLeft',
        'screenTop',
        'screenX',
        'screenY',
        'scroll',
        'scrollbars',
        'scrollBy',
        'scrollTo',
        'scrollX',
        'scrollY',
        'self',
        'status',
        'statusbar',
        'stop',
        'toolbar',
        'top',
      ],

      'no-param-reassign': 0,
      'no-void': 0,
      'react/no-children-prop': 0,
      'react-compiler/react-compiler': 'error',
      'react/jsx-no-constructed-context-values': 0,
    },
  },
];
