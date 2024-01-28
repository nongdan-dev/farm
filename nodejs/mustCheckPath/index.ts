import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const existsAsync = promisify(fs.exists)
export const mustCheckPath = async (...paths: string[]) => {
  const f = path.join(...paths)
  if (!(await existsAsync(f))) {
    throw new Error(`Path not exists ${f}`)
  }
  return f
}

export const mustCheckPathSync = (...paths: string[]) => {
  const f = path.join(...paths)
  if (!fs.existsSync(f)) {
    throw new Error(`Path not exists ${f}`)
  }
  return f
}
