import { format } from 'sql-formatter'

import { log } from '##/nodejs/log'

import { Options } from '.'

const dialectsToFormatter = {
  // with on above supported dialects
  mysql: 'mysql' as const,
  mariadb: 'mariadb' as const,
  sqlite: 'sqlite' as const,
  postgres: 'postgresql' as const,
}

export const logging = (options: Options) => {
  if (!options.logging) {
    return
  }
  const language =
    dialectsToFormatter[options.dialect as keyof typeof dialectsToFormatter]
  if (!language) {
    return
  }
  return (sql: string, executionTime?: number) => {
    const executionTimeLabel =
      typeof executionTime === 'number' ? ` ${executionTime}ms` : ''
    const re = /^Execut(ed|ing)\s+\(default\):\s+/i
    if (re.test(sql)) {
      sql = sql.replace(re, '')
      try {
        sql = format(sql, { language })
      } catch (err) {}
      log.debug(`raw sql${executionTimeLabel}:`, sql)
    }
  }
}
