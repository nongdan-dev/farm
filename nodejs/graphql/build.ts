import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import jma from 'join-monster-graphql-tools-adapter'

export const build = (defs: string[], jms: any[], res: any[]) => {
  // merge builder
  const typeDefs = mergeTypeDefs(defs)
  const resolvers = mergeResolvers(res)
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  // connect join monster options
  const jmOptions = mergeResolvers(jms)
  jma(schema, jmOptions)
  return {
    schema,
    rootValue: resolvers,
  }
}
