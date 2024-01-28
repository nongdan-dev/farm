import { Db } from './Db'

export const rawSqlSelect = (db: Db, tbl: string, where?: object) => {
  const parts = db.uq(tbl).split('.')
  tbl = parts[0]
  const key = parts[1]
  const attributes = key ? [key] : undefined
  const g = db.getQueryInterface().queryGenerator as {
    selectQuery: (...args: unknown[]) => string
  }
  return g.selectQuery(tbl, { where, attributes }).replace(/;$/, '')
}
