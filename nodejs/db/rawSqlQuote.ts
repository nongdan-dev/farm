import { Db } from './Db'

export const rawSqlQuote = (db: Db, ...idens: string[]) => {
  return db
    .getQueryInterface()
    .quoteIdentifiers(idens.join('.').split('.').map(db.uq).join('.'))
}
