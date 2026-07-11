import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../src/i18n')
const translationsPath = path.join(root, 'translations.ts')
const localesDir = path.join(root, 'locales')

const content = fs.readFileSync(translationsPath, 'utf8')

function extractBlock(code) {
  const pattern = new RegExp(`${code}:\\s*\\{([\\s\\S]*?)\\n  \\},`, 'm')
  const match = content.match(pattern)
  if (!match) throw new Error(`Block ${code} not found`)
  const body = match[1]
  const entries = [...body.matchAll(/'([^']+)':\s*'((?:\\'|[^'])*)'/g)].map((m) => [
    m[1],
    m[2].replace(/\\'/g, "'"),
  ])
  return Object.fromEntries(entries)
}

const NEW_KEYS = {
  'campusLife.selectLocation': 'Select location',
  'campusLife.mealDivision': 'Category',
  'campusLife.prevWeek': 'Previous week',
  'campusLife.nextWeek': 'Next week',
  'campusLife.noMenuData': 'No cafeteria menu data available.',
  'campusLife.noMenuDetails': 'Menu details are not available for this dining hall yet.',
  'emergency.title': 'Emergency',
  'emergency.embassyTitle': "My country's embassy",
  'emergency.call': 'Call',
  'emergency.map': 'Map',
  'emergency.nearestHelp': 'Nearest help',
  'emergency.navigate': 'Navigate',
}

function toModule(obj, exportName = 'messages') {
  const lines = Object.entries(obj).map(
    ([key, value]) => `  '${key}': ${JSON.stringify(value)},`,
  )
  return `import type { MessageDictionary } from '../types'\n\nconst ${exportName}: MessageDictionary = {\n${lines.join('\n')}\n}\n\nexport default ${exportName}\n`
}

function mergeKeys(base, extra) {
  return { ...base, ...extra }
}

const en = mergeKeys(extractBlock('EN'), NEW_KEYS)
const ko = mergeKeys(extractBlock('KO'), {
  'campusLife.selectLocation': '장소선택',
  'campusLife.mealDivision': '구분',
  'campusLife.prevWeek': '이전 주',
  'campusLife.nextWeek': '다음 주',
  'campusLife.noMenuData': '식당 메뉴 데이터가 없습니다.',
  'campusLife.noMenuDetails': '이 식당의 메뉴 정보를 아직 불러올 수 없습니다.',
  'emergency.title': '긴급',
  'emergency.embassyTitle': '우리나라 대사관',
  'emergency.call': '전화',
  'emergency.map': '지도',
  'emergency.nearestHelp': '가까운 도움',
  'emergency.navigate': '길찾기',
})
const zh = mergeKeys(extractBlock('ZH'), {
  'campusLife.selectLocation': '选择地点',
  'campusLife.mealDivision': '分类',
  'campusLife.prevWeek': '上一周',
  'campusLife.nextWeek': '下一周',
  'campusLife.noMenuData': '暂无食堂菜单数据。',
  'campusLife.noMenuDetails': '该食堂的菜单详情暂不可用。',
  'emergency.title': '紧急',
  'emergency.embassyTitle': '我国大使馆',
  'emergency.call': '电话',
  'emergency.map': '地图',
  'emergency.nearestHelp': '最近帮助',
  'emergency.navigate': '导航',
})

fs.mkdirSync(localesDir, { recursive: true })
fs.writeFileSync(path.join(localesDir, 'en.ts'), toModule(en))
fs.writeFileSync(path.join(localesDir, 'ko.ts'), toModule(ko))
fs.writeFileSync(path.join(localesDir, 'zh.ts'), toModule(zh))

console.log('Extracted en/ko/zh with', Object.keys(en).length, 'keys')
