export type Id = {
  id: string
}
export type IdsMap<V extends Id> = {
  ids: string[]
  map: { [id: string]: V }
}
export const initialIm = <V extends Id>(): IdsMap<V> => ({
  ids: [],
  map: {},
})
