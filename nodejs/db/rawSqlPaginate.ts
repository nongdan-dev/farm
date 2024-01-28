import { Db } from './Db'
import { Model } from './Model'
import { RawSqlOrderBy } from './rawSqlOrderBy'

export type JmOrderBy<M extends Model> = Pick<RawSqlOrderBy, 'direction'> & {
  by: M['$K']
}
export type JmSearch<M extends Model> = Partial<{
  where: M['$W']
  order: (M['$K'] | JmOrderBy<M>)[]
}>
export type JmById = string
export type JmCtx = JmSearch<any> | JmById

export type RawSqlPagination = {
  tbl: string
  where?: object
  order: RawSqlOrderBy[]
  page?: Pagination
}
export type Pagination = {
  limit?: number
  offset?: number
}

export const rawSqlPaginate = (db: Db, opt: RawSqlPagination) => {
  const { tbl, where, order, page = {} } = opt
  let { limit, offset } = page
  if (!limit && limit !== 0) {
    limit = 100
  } else if (limit > 1000) {
    limit = 1000
  }
  if (!offset) {
    offset = 0
  }
  return `${db.rawSqlWhere(tbl, where)}
  ORDER BY ${db.rawOrderBy(order)}
  LIMIT ${limit} OFFSET ${offset}`
}
