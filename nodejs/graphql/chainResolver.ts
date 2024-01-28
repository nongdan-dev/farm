import { set } from 'lodash'

export const chainResolver = (
  fns: any[],
  type: string,
  name: string,
  field: string,
  fn: any,
) => {
  const k = name + (field ? `.${field}` : '')
  fns.push(set({}, k, fn))
}
