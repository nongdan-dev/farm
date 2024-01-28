import { Op } from '##/nodejs/db'
import {
  Association,
  AssociationTypes,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
} from '##/nodejs/db/Associations'
import { Db } from '##/nodejs/db/Db'
import { Model } from '##/nodejs/db/Model'

import { GraphqlSchemaBuilder } from '.'
import { getFilterFields, getFilterName } from './getFilterFields'
import { InitSchemaConfig, parseFields } from './parseFields'

export type InitSchema = InitSchemaConfig

export const initSchema = <T>(
  sb: GraphqlSchemaBuilder<T>,
  m: Model,
  c?: InitSchema,
) => {
  const db = m.sequelize
  const def = sb
    .addSchema('type', m.name)
    .def(parseFields(m, c))
    .jm({
      sqlTable: db.q(m.name),
      uniqueKey:
        m.primaryKeyAttributes.length > 1
          ? (m.primaryKeyAttributes as string[])
          : m.primaryKeyAttributes[0],
    })
  const filterName = getFilterName(m)
  sb.addSchema('input', filterName).def(getFilterFields(m))
  if (m.sequelize.$options.ignoreAllAssociations === true) {
    return def
  }
  Object.entries(m.$associations).forEach(e => {
    const [type, arr] = e as [AssociationTypes, Association[]]
    arr.forEach(a => {
      if (type === 'belongsTo' || type === 'hasOne') {
        addRelationBelongsToOrHasOne(type, sb, m, a as any)
      }
      if (type === 'hasMany') {
        addRelationHasMany(sb, m, a as any)
      }
      if (type === 'belongsToMany') {
        addRelationBelongsToMany(sb, m, a as any)
      }
    })
  })
  return def
}

const addRelationBelongsToOrHasOne = <T>(
  type: string,
  sb: GraphqlSchemaBuilder<T>,
  m: Model,
  a: BelongsTo | HasOne,
) => {
  const db = m.sequelize
  const nil = `${a.allowNull ? '' : '!'}`
  // TODO
  // always allow null since we dont have delete on cascade
  void nil
  sb.addSchema('type', m.name)
    .def({ [`${a.as}`]: `${a.to.name}` })
    .jm({
      sqlTable: db.q(m.name),
      fields: {
        [a.as]: {
          sqlJoin: (parentTbl, childTbl) =>
            belongsToOrHasOneAs(type, sb, db, a, parentTbl, childTbl),
        },
      },
    })
}
const belongsToOrHasOneAs = <T>(
  type: string,
  sb: GraphqlSchemaBuilder<T>,
  db: Db,
  a: BelongsTo | HasOne,
  parentTbl: string,
  childTbl: string,
) => {
  const parentId = type === 'hasOne' ? 'id' : a.foreignKey
  const childId = type === 'hasOne' ? a.foreignKey : 'id'
  return db.rawSqlWhere(parentTbl, {
    [parentId]: { [Op.eq]: db.literal(db.q(childTbl, childId)) },
  })
}

const addRelationHasMany = <T>(
  sb: GraphqlSchemaBuilder<T>,
  m: Model,
  a: HasMany,
) => {
  const db = m.sequelize
  sb.addSchema('type', m.name)
    .def({ [`${a.as}Count(filter: ${a.to.name}Filter)`]: 'Int!' })
    .jm({
      fields: {
        [`${a.as}Count`]: {
          sqlExpr: (parentTbl, args) =>
            hasManyCount(sb, db, a, parentTbl, args),
        },
      },
    })
}
const hasManyCount = <T>(
  sb: GraphqlSchemaBuilder<T>,
  db: Db,
  a: HasMany,
  parentTbl: string,
  args: any,
) => {
  const w = db.rawSqlWhere(parentTbl, sb.parseFilter(a.to, args.filter))
  const and = w !== 'TRUE' ? db.sql`AND ${w}` : ''
  return db.sql`(
    SELECT COUNT(*) FROM ${db.q(a.to.name)}
    WHERE ${db.q(a.to.name, a.foreignKey)} = ${db.q(parentTbl, 'id')}
    ${and}
  )`
}

const addRelationBelongsToMany = <T>(
  sb: GraphqlSchemaBuilder<T>,
  m: Model,
  a: BelongsToMany,
) => {
  const db = m.sequelize
  sb.addSchema('type', m.name)
    .def({ [`${a.as}Count(filter: ${a.to.name}Filter)`]: 'Int!' })
    .jm({
      fields: {
        [`${a.as}Count`]: {
          sqlExpr: (parentTbl, args) =>
            belongsToManyCount(sb, db, a, parentTbl, args),
        },
      },
    })
}
const belongsToManyCount = <T>(
  sb: GraphqlSchemaBuilder<T>,
  db: Db,
  a: BelongsToMany,
  parentTbl: string,
  args: any,
) => {
  const w = db.rawSqlWhere(parentTbl, sb.parseFilter(a.to, args.filter))
  const and =
    w !== 'TRUE'
      ? db.sql`AND ${db.q(a.otherKey)} IN (
        SELECT ${db.q(a.to.name, 'id')} FROM ${db.q(a.to.name)}
        WHERE ${w}
      )`
      : ''
  return db.sql`(
    SELECT COUNT(*) FROM ${db.q(a.through.name)}
    WHERE ${db.q(a.through.name, a.foreignKey)} = ${db.q(parentTbl, 'id')}
    ${and}
  )`
}
