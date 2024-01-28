import { Db } from './Db'

export type RawSqlOrderBy = {
  as?: string
  tbl: string
  by: string
  direction: 'asc' | 'desc'
}

export const rawSqlOrderBy = (db: Db, arr: RawSqlOrderBy[]) => {
  const order = arr.map(o => {
    const field = o.as && o.by === 'count' ? o.tbl : `${o.tbl}.${o.by}`
    return [db.uq(field), o.direction]
  })
  const g = db.getQueryInterface().queryGenerator as {
    selectQuery: (...args: unknown[]) => string
  }
  return g
    .selectQuery('table', { order })
    .replace(/^.+ORDER\s+BY\s+/i, '')
    .replace(/;$/, '')
}
