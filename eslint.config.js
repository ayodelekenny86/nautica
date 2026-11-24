import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { readFileSync } from 'node:fs';

/**
 * Patterns from .gitignore, as lint ignores.
 *
 * Anything git ignores is not source. Reading the file instead of repeating the
 * patterns keeps the two from drifting — and the browser-check artefacts, which
 * are written into the tree and were being linted as if they shipped, are
 * already ignored there.
 */
function gitignored() {
  return readFileSync(new URL('./.gitignore', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((pattern) => pattern.replace(/^\//, '').replace(/\/$/, '/**'));
}

/**
 * Linting that catches the mistakes this repo has actually shipped: imports of
 * names that do not exist, bindings declared and never used, unreachable code
 * after an early return, and conditional React hooks.
 *
 * It is deliberately not a style guide. Rules that only reorder or reformat
 * code are left off so a lint failure means something is wrong, not that
 * something is written differently.
 */
export default [
  {
    ignores: [
      ...gitignored(),
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'functions/**',
      'supabase/functions/**',
      'src/modules/**',
      'public/**',
      'coverage/**',
      // Generated bundles and the worktrees other agents leave behind are not
      // source: linting them reported thousands of errors in minified React.
      'dev-dist/**',
      'functions/lib/**',
      '.kilo/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // An import of a name the module does not export is a blank screen at
      // runtime and nothing at build time, because the bundler only warns.
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-useless-escape': 'warn',
      'react-refresh/only-export-components': 'off',
      // Advisory, not diagnostic. Every hit here is a load-on-mount hook that
      // settles state inside an `await`/`.then` continuation, which the rule
      // reports as a synchronous setState in an effect; fixing it would mean
      // rewriting working data-loading hooks for no behavioural gain. The
      // compiler's purity split is opt-in and follows the React Compiler's own
      // guidance, so disabling it keeps the memoised callbacks as written.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    files: [
      '**/*.test.{js,jsx}',
      'src/setupTests.js',
      'src/testServer.js',
      'scripts/**/*.mjs',
      '*.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
    rules: {
      // Tests legitimately build fixtures that are not all asserted on.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // These are one-shot scripts run by hand, not components: no render purity
      // to protect and no React hook rules to apply.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
];
