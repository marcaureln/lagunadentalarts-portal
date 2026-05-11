import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    files: ['**/*.vue'],
    rules: {
      'vue/html-self-closing': 'off',
      'prettier/prettier': [
        'error',
        {},
        {
          usePrettierrc: true,
        },
      ],
    },
  },
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='getUserSession']",
          message:
            'Use requireUserSession in server routes; getUserSession is for places where a null session is a valid outcome.',
        },
      ],
    },
  }
).prepend(eslintPluginPrettierRecommended);
