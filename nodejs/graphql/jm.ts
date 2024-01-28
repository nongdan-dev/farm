import { GraphQLResolveInfo } from 'graphql'
import joinMonster from 'join-monster'

import { QueryTypes } from '##/nodejs/db'
import { Db } from '##/nodejs/db/Db'
import { JmCtx } from '##/nodejs/db/rawSqlPaginate'

const dialectsToJm = {
  mysql: 'mysql' as const,
  mariadb: 'mariadb' as const,
  sqlite: 'sqlite3' as const,
  postgres: 'pg' as const,
  // sequelize doesn't support oracle
  // join-monster doesn't support mssql
}

export const jm = (
  db: Db,
  info: GraphQLResolveInfo,
  data: JmCtx = {},
): Promise<unknown> => {
  const o = info.operation.operation
  const f = info.fieldName
  const r = info.schema.getRootType(o)
  if (!r?.getFields()[f]?.extensions.joinMonster?.where) {
    throw new Error(`Missing jm where for ${o}${f}`)
  }
  const dialect = dialectsToJm[db.getDialect() as keyof typeof dialectsToJm]
  return joinMonster(
    info,
    data,
    (sql: string) => db.query(sql, { type: QueryTypes.SELECT }),
    { dialect, minify: true },
  )
}
