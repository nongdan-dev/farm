const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const rr = require('./repoRoot')

const cwd = process.cwd()

const envPaths = [
  // this .env
  path.join(cwd, '.env'),
  // root .env
  path.join(rr.repoRoot, '.env'),
  // root .env.example
  path.join(rr.repoRoot, '.env.example'),
]
envPaths
  .filter(fs.existsSync)
  .forEach(e => dotenv.config({ path: e, override: false }))

// register babel require hook for ts/tsx extensions
const { whitelist, ...babelrc } = require('./babelrc')
require('@babel/register')(babelrc)

void whitelist

// register tsconfig-paths require hook
require('tsconfig-paths/register')

// lazy check circular imports if running on dev
let setCircularImportsEntryPoint
if (process.env.NODE_ENV === 'devevelopment') {
  const m = require('##/nodejs/check-circular-imports')
  setCircularImportsEntryPoint = m.setCircularImportsEntryPoint
  setImmediate(m.checkCircularImports)
}

module.exports = (index = path.join(cwd, './index.ts')) => {
  const { log } = require('##/nodejs/log')
  if (process.env.DEPLOYMENT_ENV === 'local') {
    // clear stdout
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H',
    )
  }
  // register global error handlers
  process.on('uncaughtException', log.stack)
  process.on('unhandledRejection', log.stack)
  try {
    if (setCircularImportsEntryPoint) {
      setCircularImportsEntryPoint(index)
    }
    require(index)
  } catch (err) {
    log.stack(err, 'fatal')
  }
}
