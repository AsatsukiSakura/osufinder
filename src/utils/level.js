const LEVEL_MAP = { green: '绿色', yellow: '黄色', red: '红色' }
const LEVEL_DESC_MAP = { green: '公开', yellow: '内部', red: '机密' }

export function getLevelLabel(level) {
  return LEVEL_DESC_MAP[level] || ''
}

export function getLevelFullLabel(level) {
  return `${LEVEL_MAP[level]} · ${LEVEL_DESC_MAP[level]}` || ''
}