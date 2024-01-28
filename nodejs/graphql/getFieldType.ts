export const getFieldType = (name: string, type: string) => {
  if (name === 'id' || name.endsWith('Id')) {
    return 'ID'
  }
  switch (type) {
    case 'BOOLEAN':
      return 'Boolean'
    case 'INTEGER':
      return 'Int'
    case 'FLOAT':
      return 'Float'
    case 'STRING':
    case 'ENUM':
    case 'TEXT':
      return 'String'
    case 'DATE':
      return 'DateTime'
    case 'JSON':
      return 'Json'
    default:
      throw new Error(`Db type ${type} is not supported`)
  }
}
