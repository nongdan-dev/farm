import { Options as SequelizeOptions, Sequelize } from 'sequelize'

import { Db, Options as PrivateOptions } from './Db'
import { extendDb } from './extendDb'
import { logging } from './logging'

export * from 'sequelize'

export type Options = PrivateOptions & { logging?: boolean } & Required<
    Pick<
      SequelizeOptions,
      'dialect' | 'host' | 'username' | 'password' | 'database'
    >
  >

export const createDb = (options: Options) => {
  if (!['mysql', 'mariadb', 'sqlite', 'postgres'].includes(options.dialect)) {
    throw new Error(`Dialect ${options.dialect} is not supported`)
  }
  const db = new Sequelize({
    ...options,
    define: {
      freezeTableName: true,
      timestamps: true,
      updatedAt: false,
      paranoid: false,
    },
    // logging: logging(options),
    // benchmark: options.logging,
    logging: void logging,
  }) as Db
  extendDb(db, options)
  return db
}
