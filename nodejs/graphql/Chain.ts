import { GraphQLFieldResolver, GraphQLType } from 'graphql'
import { omit, pick } from 'lodash'

import { chainDef } from './chainDef'
import { chainJm } from './chainJm'
import { chainResolver } from './chainResolver'
import { JmOption } from './JmOption'

export type Chain<T, R> = {
  def(def?: ChainDef): Omit<Chain<T, R>, 'def'>
  jm(jm: JmOption): Omit<Chain<T, R>, 'def'>
  res(fn: GraphQLFieldResolver<any, T, any, PromiseLike<R>>): void
  type(t: GraphQLType): void
}
export type ChainDef = string | string[] | { [k: string]: string }

export type CreateChainType =
  | 'query'
  | 'mutation'
  | 'type'
  | 'scalar'
  | 'enum'
  | 'input'
  | 'directive'

export const createChain = <T, R>(
  defs: string[],
  jms: any[],
  res: any[],
  type: CreateChainType,
  name: string,
): Pick<Chain<T, R>, 'def'> => {
  let field = ''
  if (type === 'query') {
    type = 'type'
    field = name
    name = 'Query'
  } else if (type === 'mutation') {
    type = 'type'
    field = name
    name = 'Mutation'
  }
  const chain: Chain<T, R> = {
    def: def => {
      chainDef(defs, type, name, field, def)
      return omit(chain, 'def')
    },
    jm: jm => {
      chainJm(jms, type, name, field, jm)
      return omit(chain, 'def')
    },
    res: fn => {
      chainResolver(res, type, name, field, fn)
    },
    type: t => {
      chainResolver(res, type, name, field, t)
    },
  }
  return pick(chain, 'def')
}
