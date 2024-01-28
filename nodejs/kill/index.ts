import { ChildProcess, exec, spawn } from 'child_process'
import treeKill from 'tree-kill'
import { promisify } from 'util'

import { waitTimeout } from '##/shared/waitTimeout'

const execAsync = promisify(exec)
const spawnAsync = promisify(spawn)

export const kill = async (process?: ChildProcess) => {
  if (!process) {
    return
  }
  process.stdin?.write('q')
  process.stdin?.end()
  killPid(process.pid)
  process.kill()
  await waitTimeout()
  process.kill('SIGKILL')
}

const killPid = async (pid?: number) => {
  if (!pid) {
    return
  }
  if (process.platform === 'win32') {
    await spawnAsync('taskkill', ['/pid', `${pid}`, '/f', '/t'], {
      killSignal: 'SIGTERM',
      detached: true,
    })
  }
  return killRecursively(pid)
}

const killRecursively = async (pid: number, ps?: string[]) => {
  const children = await getChildrenUnix(pid, ps)
  const promises: Promise<unknown>[] = []
  try {
    const p = new Promise((resolve, reject) => {
      treeKill(pid, 'SIGTERM', e => (e ? reject(e) : resolve(e)))
    })
    promises.push(p)
  } catch (err) {
    // ignore
  }
  children.forEach(child => promises.push(killRecursively(child, ps)))
  await Promise.all(promises)
}
const getChildrenUnix = async (pid: number, ps?: string[]) => {
  const children: number[] = []
  try {
    if (!ps) {
      ps = await execAsync(`ps -opid="" -oppid="" | grep ${pid}`)
        .then(({ stdout, stderr }) => [stdout, stderr])
        .then(arr => arr.join('\n').trim().split(/\n/))
        .catch(() => [])
    }
    ps.map(pgroup => pgroup.trim())
      .filter(pgroup => pgroup)
      .forEach(pgroup => {
        const arr = pgroup.split(/\s+/)
        const child = parseInt(arr[0], 10)
        const parent = parseInt(arr[1], 10)
        if (isNaN(child) || isNaN(parent) || parent !== pid) {
          return
        }
        children.push(child)
      })
  } catch (err) {
    // ignore
  }
  return children
}
