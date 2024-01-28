import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { parseMutationConfig } from './initSchemaCreate'
import { chainById } from './initSchemaDetail'
import { InitSchemaConfig } from './parseFields'

export type InitSchemaUpdate = InitSchemaConfig &
  Partial<{
    ignoreUpdateById: true
  }>

export const initSchemaUpdate = <
  T,
  M extends Model,
  C extends InitSchemaUpdate,
>(
  sb: GraphqlSchemaBuilder<T>,
  m: M,
  c?: C,
) => {
  const { name, args, res, customReturn } = parseMutationConfig(sb, m, {
    ...c,
    mutation: 'update',
  })
  if (!c?.ignore && !c?.ignoreUpdateById) {
    args.unshift('id: ID!')
  }
  const def = [args.length && `(${args.join(', ')})`, res]
  return chainById<T, C, 'update'>(sb, 'mutation', name, def, customReturn)
}
