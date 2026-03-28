# Contributing

## Project structure

- `package.json` — extension manifest; declares language support and grammar file location
- `syntaxes/hsml.tmLanguage.json` — TextMate grammar used for tokenization
- `language-configuration.json` — language configuration defining comments and brackets

## Development

1. Open this folder in VS Code
2. Run `pnpm install`
3. Press `F5` to open a new window with the extension loaded
4. Create or open a `.hsml` file to verify syntax highlighting

## Making changes

- After editing grammar or language configuration files, reload the extension host window (`Cmd+R` / `Ctrl+R`) to pick up changes
- Run `pnpm run preflight` before submitting a PR

## Adding language features

To add features such as IntelliSense, hovers, and validators, see the [VS Code Language Extensions guide](https://code.visualstudio.com/api/language-extensions/overview).
