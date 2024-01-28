import { ChainDef } from './Chain'

export const chainDef = (
  defs: string[],
  type: string,
  name: string,
  field: string,
  def: ChainDef = '',
) => {
  if (field && typeof def === 'object') {
    throw new Error(`${type}.${field} def should be string`)
  }
  if (typeof def === 'object' && !Array.isArray(def)) {
    def = Object.entries(def).reduce(
      (a: string[], [k, v]) => [`${k}: ${v}`, ...a],
      [],
    )
  }
  if (typeof def === 'string') {
    def = def.trim()
  }
  if (Array.isArray(def)) {
    def = `{${def.join('\n')}}`
  } else if (def && !def.includes(':')) {
    def = `: ${def}`
  } else if (def.endsWith(')')) {
    def = `${def}: Null`
  }
  if (field) {
    if (!def) {
      def = ': Null'
    }
    def = `{${field}${def}}`
  }
  defs.push(`${type} ${name} ${def}`)
}
