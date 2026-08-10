# Shopify Theme Delete Runner

Interactive terminal tool for deleting multiple Shopify themes at once.

Shopify CLI’s built-in `shopify theme delete` is often single-select. This runner adds checkbox multi-select, a confirmation step, then a final delete-or-cancel choice.

## Why use this

- Pick several themes without copying IDs
- Confirm before anything is deleted
- Choose any store you can access
- Live themes are blocked from selection
- Clear on-screen keyboard instructions while selecting

## Requirements

1. **Node.js 18+**
2. **Shopify CLI** installed and logged in  
   Install guide: https://shopify.dev/docs/api/shopify-cli
3. Access to the Shopify store(s) you want to clean up

Check Shopify CLI:

```bash
shopify version
shopify auth login
```

## Install

```bash
git clone https://github.com/d-farrell/shopify-theme-delete-runner.git
cd shopify-theme-delete-runner
npm install
```

## Usage

```bash
npm start
```

or:

```bash
node delete-themes.mjs
```

### Flow

1. Enter a store name or domain  
   Examples: `my-store` or `my-store.myshopify.com`
2. Multi-select themes (instructions appear under the list in orange):
   - `↑` / `↓` move between themes
   - `Space` select or deselect a theme
   - `a` select all
   - `i` invert selection
   - `Enter` confirm when done
3. Confirm you are happy with the list
4. Choose **Delete selected themes** or **Cancel**

If you cancel at either confirm step, nothing is deleted.

## Safety notes

- The live theme cannot be selected
- Deletes are permanent
- Always double-check names before confirming
- Prefer cleaning a development / staging store first if you are unsure

## Use in other projects

You can copy `delete-themes.mjs` into another repo, then install the dependency:

```bash
npm install @inquirer/prompts
```

Add a script to that project’s `package.json` if you want:

```json
{
  "scripts": {
    "themes:delete": "node delete-themes.mjs"
  }
}
```

## Troubleshooting

| Problem | What to try |
|---|---|
| `shopify: command not found` | Install Shopify CLI and reopen your terminal |
| Auth / permission errors | Run `shopify auth login` and confirm store access |
| Empty theme list | Check the store spelling and that you are logged into the right account |
| JSON parse error | Update Shopify CLI (`shopify version`) and try again |

## License

MIT
