require('json5/lib/register')
const path = require('path')
const { repoRoot } = require('../entrypoint/repoRoot')

require.extensions['.json'] = require.extensions['.json5']
const tsconfig = path.join(repoRoot, 'tsconfig.json')
const alias = require(tsconfig).compilerOptions.paths

Object.entries(alias).forEach(a => {
  delete alias[a[0]]
  const [k, v] = [a[0], a[1][0]].map(_ => _.replace(/\/\*$/, ''))
  alias[k] = path.join(repoRoot, v)
})

const es6 = p => {
  const m = require(p)
  return m.default || m
}
const moduleResolverBabelPlugin = [
  es6('babel-plugin-module-resolver'),
  { alias },
]

const extensions = [
  // try to resolve `.web.*` first
  '.web.js',
  '.web.ts',
  '.web.tsx',
  '.js',
  '.ts',
  '.tsx',
]

module.exports = {
  alias,
  extensions,
  moduleResolverBabelPlugin,
}
