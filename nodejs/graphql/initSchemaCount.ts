import { GraphQLFieldResolver } from 'graphql'

import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { combineAnd } from './combineAnd'
import { getFilterName } from './getFilterFields'
import { SearchArgs } from './initSchemaSearch'
import { InitSchemaConfig, parseObjectFields } from './parseFields'

export type CountArgs = Pick<SearchArgs, 'filter'>
export type InitSchemaCount = Pick<InitSchemaConfig, 'name' | 'virtual'>

export const initSchemaCount = <T, M extends Model, C extends InitSchemaCount>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const name = c?.name || `count${m.name}`
  const filterName = getFilterName(m)
  const fields = parseObjectFields({
    ...c?.virtual,
    filter: filterName,
  })
  const chain = sb
    .addSchema<M['$W'] | void>('query', name)
    .def(`(${fields.join(',')}): Int!`)
  const originalResolve = chain.res
  chain.res = fn => {
    const overrideFn: GraphQLFieldResolver<any, any> = async (
      parent,
      args,
      ctx,
      info,
    ) => {
      const w1 = sb.parseFilter(m, args.filter)
      const w2 = await fn(parent, args, ctx, info)
      const where = combineAnd(w1, w2 as any)
      return m.xCount(where as any) as any
    }
    originalResolve(overrideFn as any)
  }
  return chain
}
