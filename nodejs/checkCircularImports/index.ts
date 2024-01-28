import Module from 'module'
import path from 'path'

import rr from '##/nodejs/entrypoint/repoRoot'
import { log } from '##/nodejs/log'
import { checkCircularDependencies } from '##/shared/checkCircularDependencies'

const removeRepoRootFromFileName = (fileName: string) =>
  fileName.replace(rr.repoRoot, '').replace(/^\W/, '')

const resolvedFileNameMap: {
  [parentFileName: string]: {
    [fileName: string]: boolean
  }
} = {}

const oldRequireFn = Module.prototype.require
function newRequireFn(this: Module, fileName: string) {
  // check if is not a relative import
  if (!fileName.startsWith('.')) {
    return oldRequireFn.call(this, fileName)
  }
  // remove extension from parentFileName, fileName likely does not have extension
  const parentFileName = this.filename.replace(/\.[^.]+$/, '')
  const fileNameAbs = path.join(path.dirname(parentFileName), fileName)
  // check if node_modules, or not in this repo
  if (
    /[/\\]node_modules[/\\]/.test(fileNameAbs) ||
    !fileNameAbs.startsWith(rr.repoRoot)
  ) {
    return oldRequireFn.call(this, fileName)
  }
  const parentFileNameWithoutSrc = removeRepoRootFromFileName(parentFileName)
  if (!(parentFileNameWithoutSrc in resolvedFileNameMap)) {
    resolvedFileNameMap[parentFileNameWithoutSrc] = {}
  }
  const fileNameWithoutSrc = removeRepoRootFromFileName(fileNameAbs)
  resolvedFileNameMap[parentFileNameWithoutSrc][fileNameWithoutSrc] = true
  return oldRequireFn.call(this, fileName)
}
newRequireFn.resolve = oldRequireFn.resolve
newRequireFn.cache = oldRequireFn.cache
newRequireFn.extensions = oldRequireFn.extensions
newRequireFn.main = oldRequireFn.main
Module.prototype.require = newRequireFn

let entry = removeRepoRootFromFileName(process.cwd())
export const setCircularImportsEntryPoint = (e: string) => {
  entry = removeRepoRootFromFileName(path.dirname(e))
}

export const checkCircularImports = () => {
  const circular = checkCircularDependencies(resolvedFileNameMap)
  circular.forEach(c => log.warn(`cicular dependency in ${entry}: ${c}`))
}
