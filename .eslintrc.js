module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parser: 'babel-eslint',
  plugins: ['prettier'],
  env: {
    jest: true,
    node: true
  },
  parserOptions: {
    ecmaFeatures: {
      restParams: true,
      experimentalObjectRestSpread: true
    }
  },
  ignorePatterns: ['node_modules/'],
  rules: {
    'comma-dangle': 0,
    'consistent-return': 0,
    'func-names': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'prefer-arrow-callback': 0,
    'space-before-function-paren': 0,
    'prettier/prettier': [2, { printWidth: 80 }]
  },
  globals: {
    // Constants defined in examples webpack.config
    __ROLLBAR_ACCESS_TOKEN__: true,
    __GIT_REVISION__: true
  }
};
