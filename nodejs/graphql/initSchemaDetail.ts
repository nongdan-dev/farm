import { GraphQLFieldResolver } from 'graphql'

import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { CreateChainType } from './Chain'
import { InitSchemaConfig, parseObjectFields } from './parseFields'

export type InitSchemaDetail = Pick<
  InitSchemaConfig,
  'name' | 'ignore' | 'virtual' | 'return'
>

export const initSchemaDetail = <
  T,
  M extends Model,
  C extends InitSchemaDetail,
>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const name = c?.name || `detail${m.name}`
  const customReturn = c?.ignore && c.return !== undefined
  const res = customReturn ? c.return : `${m.name}!`
  const f = parseObjectFields(c?.virtual).concat(c?.ignore ? [] : ['id: ID!'])
  const vars = f.length ? `(${f.join(', ')})` : undefined
  return chainById<T, C, 'detail'>(sb, 'query', name, [vars, res], customReturn)
}

type RById<
  C extends InitSchemaConfig,
  CT extends 'create' | 'update' | 'detail',
> = C['ignore'] extends true
  ? C['return'] extends false
    ? void
    : C['return'] extends string
      ? any
      : string
  : C extends { ignoreUpdateById: true }
    ? string
    : CT extends 'create'
      ? string
      : void
export const chainById = <
  T,
  C extends InitSchemaDetail,
  CT extends 'create' | 'update' | 'detail',
>(
  sb: GraphqlSchemaBuilder<T>,
  type: CreateChainType,
  name: string,
  def: unknown[],
  customReturn?: boolean,
) => {
  const chain = sb
    .addSchema<RById<C, CT>>(type, name)
    .def(def.filter(v => v).join(': '))
    .jm({ where: sb.jmWhereById })
  const originalResolve = chain.res
  chain.res = fn => {
    const overrideFn: GraphQLFieldResolver<any, any> = async (
      parent,
      args,
      ctx,
      info,
    ) => {
      const r = await fn(parent, args, ctx, info)
      if (customReturn) {
        return r
      }
      return sb.jm(info, r || args.id) as any
    }
    originalResolve(overrideFn as any)
  }
  return chain
}
