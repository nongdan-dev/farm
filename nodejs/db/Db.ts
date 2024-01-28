import { Sequelize } from 'sequelize'
import { Literal } from 'sequelize/types/utils'

import { Attributes, Model, Models } from './Model'
import { RawSqlOrderBy } from './rawSqlOrderBy'
import { RawSqlPagination } from './rawSqlPaginate'

export type Options = {
  ignoreAllowNull?: boolean
  ignoreAllAssociations?: boolean
}

export interface Db extends Sequelize {
  // override
  $options: Options
  models: Models
  xDefine<T extends Attributes = any>(name: string, attrs: T): Model<T>

  // prepare associations
  // must require all models before calling this
  prepareAssociations(): void

  // raw sql build select
  rawSqlSelect(tbl: string, where?: object): string
  rawSqlSelectLiteral(tbl: string, where?: object): Literal
  // raw sql build where
  rawSqlWhere(tbl: string, where?: object): string
  // raw sql build where with order by, offset, limit
  rawSqlPaginate(opt: RawSqlPagination): string
  // raw sql build order by
  rawOrderBy(arr: RawSqlOrderBy[]): string
  // raw sql quote identifiers
  q(...idens: string[]): string
  // raw sql unquote identifiers
  uq(name: string): string

  // syntax highlight
  sql: (typeof String)['raw']
}
