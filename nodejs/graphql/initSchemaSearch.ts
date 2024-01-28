import { GraphQLFieldResolver } from 'graphql'

import { Model } from '##/nodejs/db/Model'
import { JmSearch, Pagination } from '##/nodejs/db/rawSqlPaginate'

import { GraphqlSchemaBuilder } from '.'
import { combineAnd } from './combineAnd'
import { getFilterName } from './getFilterFields'
import {
  getOrderByFields,
  getOrderByName,
  ParseOrderBy,
  parseOrderBy,
} from './getOrderByFields'
import { JmNode } from './JmOption'
import { InitSchemaConfig, parseObjectFields } from './parseFields'
import { Filter } from './parseFilter'

export type SearchArgs = {
  filter: Filter
  order: string
  page: Pagination
}
export type InitSchemaSearch = Pick<InitSchemaConfig, 'name' | 'virtual'>

export const initSchemaSearch = <
  T,
  M extends Model,
  C extends InitSchemaSearch,
>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const db = m.sequelize
  const name = c?.name || `search${m.name}`
  const filterName = getFilterName(m)
  const orderByName = getOrderByName(m)
  sb.addSchema('enum', orderByName).def(getOrderByFields(m))
  const fields = parseObjectFields({
    ...c?.virtual,
    filter: filterName,
    orderBy: orderByName,
    page: 'Pagination',
  })
  const chain = sb
    .addSchema<JmSearch<M> | void>('query', name)
    .def(`(${fields.join(',')}): [${m.name}!]!`)
    .jm({
      where: (jmTbl: string, args: any, data: JmSearch<M>, node) => {
        const { filter, orderBy, page } = args
        // where
        const w1 = sb.parseFilter(m, filter)
        const w2 = data.where
        const where = combineAnd(w1, w2)
        // order
        const o = parseOrderBy(orderBy)
        const fe = o && [{ ...o, tbl: getOrderByTbl(m, o, node) || jmTbl }]
        const be = data.order?.map(b =>
          typeof b === 'string'
            ? {
                by: b,
                direction: 'asc' as const,
                tbl: jmTbl,
              }
            : { ...b, tbl: jmTbl },
        )
        const de = [{ tbl: jmTbl, by: 'id', direction: 'desc' as const }]
        const order = fe || be || de
        // return
        return db.rawSqlPaginate({
          tbl: jmTbl,
          where,
          order,
          page,
        })
      },
    })
  const originalResolve = chain.res
  chain.res = fn => {
    const overrideFn: GraphQLFieldResolver<any, any> = async (
      parent,
      args,
      ctx,
      info,
    ) => {
      const search = await fn(parent, args, ctx, info)
      return sb.jm(info, search as any) as any
    }
    originalResolve(overrideFn as any)
  }
  return chain
}

const getOrderByTbl = (
  m: Model,
  o: ParseOrderBy,
  node: JmNode,
): string | undefined => {
  if (!o.as) {
    return
  }
  if (o.by === 'count') {
    const k = `${o.as}Count`
    const a = node.children.find(n => n.fieldName === k)
    if (!a) {
      throw new Error(
        `To use order by on an association count, must include that selection: ${k}`,
      )
    }
    return a.as
  }
  const a = node.children.find(n => n.type === 'table' && n.fieldName === o.as)
  if (!a) {
    throw new Error(
      `To use order by on an association field, must include at least 1 selection such as: ${o.as}{id}`,
    )
  }
  return a.as
}
