module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-tailwindcss',
  ],
  tailwindStylesheet: './src/app/globals.css',
  tailwindFunctions: ['clsx', 'cn'],
}
