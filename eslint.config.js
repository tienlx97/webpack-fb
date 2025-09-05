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
import globals from 'globals';

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
    plugins: {
      'simple-import-sort': simpleImportSort,
      'sort-keys-fix': sortKeysFix,
      'no-function-declare-after-return': noFunctionDeclareAfterReturn,
      'no-only-tests': noOnlyTests,
      'react-compiler': reactCompiler,
    },

    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
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
      'simple-import-sort/imports': 'error',
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

      'no-undef': 'error', // flag undefined identifiers like `sdasdasdad`
      'no-unused-expressions': 'error', // also flag useless expressions

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
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', String.raw`^@?\w`],
            ['^(@|components)(/.*|$)'],
            [String.raw`^\u0000`],
            [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
            [String.raw`^\./(?=.*/)(?!/?$)`, String.raw`^\.(?!/?$)`, String.raw`^\./?$`],
            [String.raw`^.+\.?(css)$`],
          ],
        },
      ],
    },
  },
];
