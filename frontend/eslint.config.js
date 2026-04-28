import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  {
    files: ['**/*.{js,jsx}'],

    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    extends: [
      js.configs.recommended,
      react.configs.recommended,
      reactHooks.configs.recommended,
    ],

    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: {
        version: 'detect', // auto-detect React version
      },
    },

    rules: {
      // 🔥 React
      'react/react-in-jsx-scope': 'off', // not needed in Vite/React 17+
      'react/prop-types': 'off', // using TS or not needed

      // 🔥 Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // 🔥 General
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',

      // 🔥 Vite fast refresh
      'react-refresh/only-export-components': 'warn',
    },
  },
]);