const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Apply recommended rules to all files
  js.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }]
    }
  },

  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**'
    ]
  }
];
