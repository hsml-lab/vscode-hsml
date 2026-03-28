[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/hsml-lab.hsml.svg)](https://marketplace.visualstudio.com/items?itemName=hsml-lab.hsml)
[![CI](https://github.com/hsml-lab/vscode-hsml/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hsml-lab/vscode-hsml/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/hsml-lab/vscode-hsml.svg)](https://github.com/hsml-lab/vscode-hsml/blob/main/LICENSE)
[![Donate: PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate?hosted_button_id=L7GY729FBKTZY)

# vscode-hsml

[HSML](https://github.com/hsml-lab/hsml) language support for Visual Studio Code.

> Still early — tracking [hsml](https://github.com/hsml-lab/hsml) as it stabilizes.

## Features

- Syntax highlighting for `.hsml` files
- Diagnostics and hover via the [hsml](https://github.com/hsml-lab/hsml) language server
- Auto-download of the `hsml` binary from GitHub releases
- Comment toggling (`//` line comments)
- Bracket matching and auto-closing pairs

## HSML syntax at a glance

```hsml
// Tags (div is the default when only class/id is used)
h1 Hello World
.container
  .card Hello

// Classes and IDs
h1#title.text-red.font-bold Hello

// Attributes
img(src="/photo.jpg" alt="A photo")
a(href="https://example.com" target="_blank") Link

// Multiline attributes
button(
  @click="handleClick"
  :disabled="loading"
  class="btn btn-primary"
) Submit

// Vue directives work as-is
div(v-if="show")
  ul
    li(v-for="item in items" :key="item.id") {{ item.name }}
```

For the full syntax reference, see the [HSML documentation](https://github.com/hsml-lab/hsml#hsml-syntax).

## License

[MIT](LICENSE)
