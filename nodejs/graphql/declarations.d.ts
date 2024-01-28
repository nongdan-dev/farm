declare module 'join-monster-graphql-tools-adapter' {
  import { GraphQLSchema } from 'graphql'

  const jma: (schema: GraphQLSchema, jmOptions: object) => void
  export = jma
}
