import { set } from 'lodash'

import { JmOption } from './JmOption'

export const chainJm = (
  jms: any[],
  type: string,
  name: string,
  field: string,
  jm: JmOption,
) => {
  if (field) {
    const k = `${name}.fields.${field}.extensions.joinMonster`
    jms.push(set({}, k, jm))
    return
  }
  if (type === 'type' && typeof jm.fields === 'object' && jm.fields) {
    Object.entries(jm.fields).forEach(([k, v]) => {
      const fk = `${name}.fields.${k}.extensions.joinMonster`
      jms.push(set({}, fk, v))
    })
    delete jm.fields
  }
  const k = `${name}.extensions.joinMonster`
  jms.push(set({}, k, jm))
}
