# tslint-custom-rules

A collection of custom TSLint rules, all of which are disabled by default; devs can choose which rules to enable

## Usage

Install:

```bash
// Yarn
yarn add tslint-custom-rules --dev

// npm
npm install tslint-custom-rules --save-dev
```

Extend the rules from your `tslint.json` file.

```json
{
  "extends": "tslint-custom-rules"
}
```

All rules are disabled by default. Enable any rules that you want to use. Example:

```json
{
  "extends": "tslint-custom-rules",
  "rules": {
    "favor-async-to-new-promises": true,
    "react-disallow-nil-in-value-props": true,
    "react-dont-mutate-props": true,
    "react-dont-mutate-state": true,
    "react-sort-jsx-element-attributes": true,
    "sort-interfaces": true
  }
}
```
