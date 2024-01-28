import { GraphQLScalarType } from 'graphql'
import {
  GraphQLDate,
  GraphQLDateTime,
  GraphQLEmailAddress,
  GraphQLJSON,
  GraphQLNegativeFloat,
  GraphQLNegativeInt,
  GraphQLNonEmptyString,
  GraphQLNonPositiveFloat,
  GraphQLNonPositiveInt,
  GraphQLPositiveFloat,
  GraphQLPositiveInt,
  GraphQLTime,
  GraphQLUnsignedFloat,
  GraphQLUnsignedInt,
} from 'graphql-scalars'

import { GraphqlSchemaBuilder } from '.'

export const addScalars = (sb: GraphqlSchemaBuilder) => {
  sb.addSchema('scalar', 'UFloat')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLUnsignedFloat,
        name: 'UFloat',
      }),
    )
  sb.addSchema('scalar', 'UInt')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLUnsignedInt,
        name: 'UInt',
      }),
    )
  sb.addSchema('scalar', 'PFloat')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLPositiveFloat,
        name: 'PFloat',
      }),
    )
  sb.addSchema('scalar', 'PInt')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLPositiveInt,
        name: 'PInt',
      }),
    )
  sb.addSchema('scalar', 'NpFloat')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLNonPositiveFloat,
        name: 'NpFloat',
      }),
    )
  sb.addSchema('scalar', 'NpInt')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLNonPositiveInt,
        name: 'NpInt',
      }),
    )
  sb.addSchema('scalar', 'NFloat')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLNegativeFloat,
        name: 'NFloat',
      }),
    )
  sb.addSchema('scalar', 'NInt')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLNegativeInt,
        name: 'NInt',
      }),
    )
  sb.addSchema('scalar', 'NeString')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLNonEmptyString,
        name: 'NeString',
      }),
    )
  sb.addSchema('scalar', 'DateTime')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLDateTime,
        name: 'DateTime',
      }),
    )
  sb.addSchema('scalar', 'SDate')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLDate,
        name: 'SDate',
      }),
    )
  sb.addSchema('scalar', 'STime')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLTime,
        name: 'STime',
      }),
    )
  sb.addSchema('scalar', 'Json')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLJSON,
        name: 'Json',
      }),
    )
  sb.addSchema('scalar', 'Email')
    .def()
    .type(
      new GraphQLScalarType({
        ...GraphQLEmailAddress,
        name: 'Email',
        serialize: (...args) =>
          GraphQLEmailAddress.serialize(...args).toLowerCase(),
        parseValue: (...args) =>
          GraphQLEmailAddress.parseValue(...args).toLowerCase(),
        parseLiteral: (...args) =>
          GraphQLEmailAddress.parseLiteral(...args).toLowerCase(),
      }),
    )
  sb.addSchema('scalar', 'Null')
    .def()
    .type(
      new GraphQLScalarType({
        name: 'Null',
        description: 'A scalar type for empty result, it will always be null',
        serialize: () => null,
        parseValue: () => null,
        parseLiteral: () => null,
      }),
    )
  sb.addSchema('input', 'Pagination').def({
    limit: 'Int',
    offset: 'Int',
  })
}
