#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { checkbox, confirm, input, select } from '@inquirer/prompts'

/**
 * Why: Shopify CLI accepts short store names or full domains.
 * We normalise so both "exco-dev-coley" and "exco-dev-coley.myshopify.com" work.
 */
function normalizeStore (rawStore) {
  const cleaned = rawStore
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  if (cleaned.length === 0) {
    throw new Error('Store is required.')
  }

  return cleaned
}

function isLiveTheme (theme) {
  return theme.role === 'live' || theme.role === 'main'
}

function runShopify (args) {
  const result = spawnSync('shopify', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout].filter(Boolean).join('\n').trim()
    throw new Error(details || `shopify ${args.join(' ')} failed`)
  }

  return result.stdout
}

/**
 * Why: CLI can print warnings before JSON. We extract the JSON array safely.
 */
function parseThemesJson (stdout) {
  const start = stdout.indexOf('[')
  const end = stdout.lastIndexOf(']')

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Could not parse theme list JSON from Shopify CLI.')
  }

  return JSON.parse(stdout.slice(start, end + 1))
}

function listThemes (store) {
  const stdout = runShopify([
    'theme',
    'list',
    '--json',
    '--store',
    store
  ])

  return parseThemesJson(stdout)
}

function formatThemeLabel (theme) {
  const role = theme.role || 'unpublished'
  return `${theme.name}  [${role}]  (ID: ${theme.id})`
}

async function main () {
  console.log('\nShopify multi-theme delete\n')

  const storeInput = await input({
    message: 'Store (e.g. exco-dev-coley or exco-dev-coley.myshopify.com):',
    validate: (value) => {
      if (value.trim().length === 0) {
        return 'Enter a store name or domain.'
      }

      return true
    }
  })

  const store = normalizeStore(storeInput)

  console.log(`\nFetching themes from ${store}...\n`)

  const themes = listThemes(store)

  if (themes.length === 0) {
    console.log('No themes found.')
    return
  }

  const selectedIds = await checkbox({
    message: 'Select themes to delete (Space to toggle, Enter to confirm):',
    pageSize: 20,
    choices: themes.map((theme) => {
      const live = isLiveTheme(theme)

      return {
        name: formatThemeLabel(theme),
        value: String(theme.id),
        disabled: live ? 'live theme (cannot delete)' : false
      }
    }),
    validate: (value) => {
      if (value.length === 0) {
        return 'Select at least one theme, or press Ctrl+C to exit.'
      }

      return true
    }
  })

  const selectedThemes = themes.filter((theme) => {
    return selectedIds.includes(String(theme.id))
  })

  console.log('\nYou selected:')
  for (const theme of selectedThemes) {
    console.log(`- ${formatThemeLabel(theme)}`)
  }
  console.log('')

  const happyWithSelection = await confirm({
    message: 'Are you happy with this selection?',
    default: false
  })

  if (happyWithSelection !== true) {
    console.log('\nCancelled. No themes were deleted.')
    return
  }

  const action = await select({
    message: 'What do you want to do?',
    choices: [
      {
        name: 'Delete selected themes',
        value: 'delete'
      },
      {
        name: 'Cancel',
        value: 'cancel'
      }
    ]
  })

  if (action !== 'delete') {
    console.log('\nCancelled. No themes were deleted.')
    return
  }

  const deleteArgs = [
    'theme',
    'delete',
    '--store',
    store,
    '--force'
  ]

  for (const theme of selectedThemes) {
    deleteArgs.push('--theme', String(theme.id))
  }

  console.log('\nDeleting selected themes...\n')
  runShopify(deleteArgs)

  console.log('Done. Selected themes were deleted.')
}

main().catch((error) => {
  console.error(`\nError: ${error.message}\n`)
  process.exitCode = 1
})
