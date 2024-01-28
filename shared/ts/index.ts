export * from 'utility-types'

type Primitive = Date | Function

export type DeepMerge<T> = {} & {
  [k in keyof T]: T[k] extends Primitive
    ? T[k]
    : T[k] extends Array<infer U>
      ? Array<DeepMerge<U>>
      : T[k] extends object
        ? DeepMerge<T[k]>
        : T[k]
}

export type Undefined<T = unknown> = T | undefined
export type Nullish<T = unknown> = T | null | undefined | void
export type Falsish<T = unknown> = Nullish<T> | false | 0 | ''
export type UPromise<T = unknown> = Undefined<Promise<Undefined<T>>>
export type NPromise<T = unknown> = Nullish<Promise<Nullish<T>>>
export type FPromise<T = unknown> = Falsish<Promise<Falsish<T>>>

type Split<T, K extends keyof T> = K extends unknown
  ? { [I in keyof T]: I extends K ? T[I] : never }
  : never
export type Explode<T> = Split<T, keyof T>

export type ExcludeNullish<T> = Exclude<T, null | undefined | void>
export type PickGraphql<Q, K extends keyof Q> = {} & Omit<
  ExcludeNullish<Required<Q>[K]>,
  '__typename'
>

export type UpperFirst<S> = S extends string
  ? S extends `${infer P1}${infer P2}`
    ? `${Uppercase<P1>}${P2}`
    : S
  : never

export type LowerFirst<S> = S extends string
  ? S extends `${infer P1}${infer P2}`
    ? `${Lowercase<P1>}${P2}`
    : S
  : never

// shortcut for `v as any as T`
export const ts = <T>(v?: unknown) => v as T
