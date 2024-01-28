import { JmCtx } from '##/nodejs/db/rawSqlPaginate'

export type JmNode = {
  children: {
    type: string
    fieldName: string
    as: string
  }[]
}

// main query: sqlTable, uniqueKey, where
// join: sqlTable, fields.sqlJoin
export type JmOption = {
  sqlTable?: string
  uniqueKey?: string | string[]
  fields?: {
    [k: string]: {
      sqlJoin?(
        parentTbl: string,
        childTbl: string,
        args: any,
        ctx: JmCtx,
        node: JmNode,
      ): string
      sqlExpr?(parentTbl: string, args: any, ctx: JmCtx, node: JmNode): string
      sqlDeps?: string[]
      resolve?: Function
    }
  }
  where?(jmTbl: string, args: any, ctx: JmCtx, node: JmNode): string
}
