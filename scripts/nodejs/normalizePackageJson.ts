import { kebabCase } from 'change-case'
import fs from 'fs'
import jsonStableStringify from 'json-stable-stringify'
import path from 'path'

const root = path.join(__dirname, '../../')
const readdirSync = (dir: string) =>
  fs
    .readdirSync(dir)
    .filter(d => d !== 'node_modules')
    .filter(d => /^[\w-]/i.test(d))
    .map(d => path.join(dir, d))
    .filter(d => fs.statSync(d).isDirectory())

readdirSync(root)
  .reduce<string[]>((a, d) => {
    readdirSync(d).forEach(i => a.push(i))
    return a
  }, [])
  .forEach(async d => {
    const name = [path.join(d, '..'), d]
      .map(_ => path.basename(_))
      .map(_ => kebabCase(_))
      .join('-')
    const pkgName = `@nongdan-dev/${name}`
    const pkgPath = path.join(d, 'package.json')

    const json = fs.existsSync(pkgPath) && fs.readFileSync(pkgPath, 'utf8')
    const pkg: {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    } = json ? JSON.parse(json) : {}
    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['##'] = '../../'
    pkg.dependencies = JSON.parse(jsonStableStringify(pkg.dependencies))
    pkg.devDependencies =
      pkg.devDependencies &&
      JSON.parse(jsonStableStringify(pkg.devDependencies))

    const pkg2 = {
      name: pkgName,
      version: '0.0.0-locked',
      private: true,
      dependencies: pkg.dependencies,
      devDependencies: pkg.devDependencies,
    }
    const json2 = JSON.stringify(pkg2, undefined, 2) + '\n'
    fs.writeFileSync(pkgPath, json2)
  })
