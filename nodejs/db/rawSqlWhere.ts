import { Db } from './Db'
import { rawSqlSelect } from './rawSqlSelect'

export const rawSqlWhere = (db: Db, tbl: string, where?: object) => {
  const w = rawSqlSelect(db, tbl, where)
  if (!w.includes('WHERE')) {
    return 'TRUE'
  }
  return w.replace(/^SELECT \* FROM "[^"]+" WHERE /i, '')
}
