import { Options } from '.'
import { Db } from './Db'
import { prepareAssociations } from './prepareAssociations'
import { rawSqlOrderBy } from './rawSqlOrderBy'
import { rawSqlPaginate } from './rawSqlPaginate'
import { rawSqlQuote } from './rawSqlQuote'
import { rawSqlSelect } from './rawSqlSelect'
import { rawSqlUnquote } from './rawSqlUnquote'
import { rawSqlWhere } from './rawSqlWhere'
import { xDefine } from './xDefine'

export const extendDb = (db: Db, options: Options) => {
  // override
  db.$options = options
  db.xDefine = (...args) => xDefine(db, ...args)

  // prepare associations
  // must require all models before calling this
  db.prepareAssociations = () => prepareAssociations(db)

  // raw sql build select
  db.rawSqlSelect = (...args) => rawSqlSelect(db, ...args)
  db.rawSqlSelectLiteral = (...args) =>
    db.literal(`(${rawSqlSelect(db, ...args)})`)
  // raw sql build where
  db.rawSqlWhere = (...args) => rawSqlWhere(db, ...args)
  // raw sql build where with order by, offset, limit
  db.rawSqlPaginate = (...args) => rawSqlPaginate(db, ...args)
  // raw sql build order by
  db.rawOrderBy = (...args) => rawSqlOrderBy(db, ...args)
  // raw sql quote identifiers
  db.q = (...args) => rawSqlQuote(db, ...args)
  // raw sql unquote identifiers
  db.uq = (...args) => rawSqlUnquote(...args)

  // syntax highlight
  db.sql = String.raw
}
