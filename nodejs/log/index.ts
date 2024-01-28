import CircularJson from 'circular-json'
import { bold, cyan, gray, magenta, red, yellow } from 'colors/safe'
import stacktrace, { StackFrame } from 'stack-trace'

import rr from '##/nodejs/entrypoint/repoRoot'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const levelLabelMap = {
  debug: '[DEBUG]',
  info: ' [INFO]',
  warn: ' [WARN]',
  error: '[ERROR]',
  fatal: '[FATAL]',
}
const levelColorFnMap = {
  debug: (v: string) => v,
  info: cyan,
  warn: yellow,
  error: red,
  fatal: magenta,
}
const levelPriorityMap = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

class Log {
  level: LogLevel = 'debug'

  cwd = process.cwd()
  displayNodeModulesPath = true

  cacheSize = 1000
  stdall: string[] = []
  stdout: string[] = []
  stderr: string[] = []

  stack = (err: unknown, lv: LogLevel = 'error') => {
    if (!err) {
      return
    }
    lv = this.getLabel(lv) ? lv : 'error'
    const [msg, stack] = this.readError(err as Error)
    return this.println(lv, msg, stack)
  }
  private readError = (e: Error) =>
    typeof e.message === 'string'
      ? [e.message.replaceAll(rr.repoRoot, ''), this.cleanupErrorStack(e)]
      : ['<UNKNOWN ERROR> ' + CircularJson.stringify(e), '']

  private createLogFn =
    (lv: LogLevel) =>
    (msg: string, condition: unknown = true) => {
      if (!condition || this.getPriority(lv) < this.getPriority()) {
        return
      }
      this.println(lv, msg, condition)
    }
  debug = this.createLogFn('debug')
  info = this.createLogFn('info')
  warn = this.createLogFn('warn')
  error = this.createLogFn('error')
  fatal = this.createLogFn('fatal')

  private push = (k: 'stdall' | 'stdout' | 'stderr', msg: string) => {
    if (!this.cacheSize) {
      return
    }
    const arr = this[k]
    if (arr.length >= this.cacheSize) {
      arr.shift()
    }
    arr.push(msg)
  }

  private println = (lv: LogLevel, msg: string, condition?: unknown) => {
    const now = this.getTimeStamp()
    const label = this.getLabel(lv)
    const location = this.getLocation(stacktrace.get()[2])
    msg = this.colorize(msg, bold)
    msg =
      this.colorize(`${now} ${label} `, this.getColorFn(lv)) +
      this.colorize(`${location} `, gray) +
      this.colorize(msg, this.getColorFn(lv))
    if (typeof condition === 'string') {
      condition = this.colorize(condition, gray)
    } else if (condition instanceof Error) {
      condition = this.readError(condition).join('\n')
    } else if (typeof condition !== 'boolean') {
      condition = CircularJson.stringify(condition)
    }
    if (typeof condition === 'string') {
      msg = msg + '\n' + condition
    }
    this.push('stdall', msg)
    if (lv === 'error' || lv === 'fatal') {
      this.push('stderr', msg)
      console.error(msg)
    } else {
      this.push('stdout', msg)
      console.log(msg)
    }
    if (lv === 'fatal') {
      process.exit(1)
    }
  }

  color = true
  private colorize = (msg: string, fn: (v: string) => string) =>
    this.color ? fn(msg) : msg

  timezone = new Date().getTimezoneOffset() / -60
  private getTimeStamp = () => {
    let date = new Date()
    const d = this.timezone * -60 + date.getTimezoneOffset()
    date = new Date(date.getTime() + d * 60 * 1000)
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ]
      .map((n, i) => {
        let s = ''
        if (n < 10) {
          s += '0'
        }
        s += n
        if (i < 2) {
          s += '/'
        } else if (i === 2) {
          s += ' '
        } else if (i < 5) {
          s += ':'
        }
        return s
      })
      .join('')
  }

  private getLocation = (frame: StackFrame) => {
    let fileName = frame?.getFileName()
    if (!fileName) {
      return ''
    }
    const trim = (dir: string) =>
      fileName.replace(dir, '').replace(/^[\\/]*/, '')
    if (fileName.indexOf('node_modules') >= 0) {
      if (!this.displayNodeModulesPath) {
        return ''
      }
      const nm = fileName.substring(
        0,
        fileName.lastIndexOf('node_modules') + 12,
      )
      fileName =
        '~' + trim(nm).replace(/([\\/]).+([\\/][^\\/]+[\\/])/, '$1...$2')
    } else if (fileName.startsWith(rr.repoRoot)) {
      fileName = trim(rr.repoRoot)
    } else {
      return ''
    }
    return `${fileName}:${frame.getLineNumber()}`
  }
  private cleanupErrorStack = (err: Error) => {
    let maxFuncLength = 0
    const stacks: { f: string; l: string }[] = []
    const frames = (err && stacktrace.parse(err)) || []
    frames.forEach(frame => {
      const l = this.getLocation(frame)
      if (!l) {
        return
      }
      let f = frame.getFunctionName() || frame.getMethodName()
      f = f ? f.replace(/\S+\./g, '') : '<anonnymous>'
      stacks.push({ f, l })
      if (f.length > maxFuncLength) {
        maxFuncLength = f.length
      }
    })
    return stacks
      .map(s => `    at ${s.f.padEnd(maxFuncLength, ' ')} ${s.l}`)
      .join('\n')
  }
  private getLabel = (lv = this.level) => levelLabelMap[lv]
  private getColorFn = (lv = this.level) => levelColorFnMap[lv]
  private getPriority = (lv = this.level) => levelPriorityMap[lv]
}

export const log = new Log()
