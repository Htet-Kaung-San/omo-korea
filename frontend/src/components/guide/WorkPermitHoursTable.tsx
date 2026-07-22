import { Fragment } from 'react'

const cellBase = 'border border-pnu-border px-2 py-2 align-middle text-center leading-snug'
const headerCell = `${cellBase} bg-slate-50 font-semibold text-pnu-text`
const bodyCell = `${cellBase} text-pnu-muted`

interface HourBlock {
  id: string
  courseKey: string
  yearKey: string
  criteriaKey: string
  notMetHoursKey: string
  metWeekdayKey: string
  metWeekendKey: string
  bonusKey: string
}

const HOUR_BLOCKS: HourBlock[] = [
  {
    id: 'bachelor-y12',
    courseKey: 'workPermit.hours.table.bachelor',
    yearKey: 'workPermit.hours.table.bachelorY12',
    criteriaKey: 'workPermit.hours.table.criteria.bachelorY12',
    notMetHoursKey: 'workPermit.hours.table.hours10',
    metWeekdayKey: 'workPermit.hours.table.hours25',
    metWeekendKey: 'workPermit.hours.table.unlimited',
    bonusKey: 'workPermit.hours.table.hours30',
  },
  {
    id: 'bachelor-y34',
    courseKey: 'workPermit.hours.table.bachelor',
    yearKey: 'workPermit.hours.table.bachelorY34',
    criteriaKey: 'workPermit.hours.table.criteria.bachelorY34',
    notMetHoursKey: 'workPermit.hours.table.hours10',
    metWeekdayKey: 'workPermit.hours.table.hours25',
    metWeekendKey: 'workPermit.hours.table.unlimited',
    bonusKey: 'workPermit.hours.table.hours30',
  },
  {
    id: 'grad',
    courseKey: 'workPermit.hours.table.grad',
    yearKey: 'workPermit.hours.table.anyYear',
    criteriaKey: 'workPermit.hours.table.criteria.grad',
    notMetHoursKey: 'workPermit.hours.table.hours15',
    metWeekdayKey: 'workPermit.hours.table.hours30',
    metWeekendKey: 'workPermit.hours.table.unlimited',
    bonusKey: 'workPermit.hours.table.hours35',
  },
]

export function WorkPermitHoursTable({ t }: { t: (key: string) => string }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-pnu-border">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <caption className="px-3 py-2 text-left text-xs font-semibold text-pnu-text">
          {t('workPermit.hours.table.title')}
        </caption>
        <thead>
          <tr>
            <th rowSpan={2} scope="col" className={`${headerCell} min-w-[3.5rem]`}>
              {t('workPermit.hours.table.colCourse')}
            </th>
            <th rowSpan={2} scope="col" className={`${headerCell} min-w-[3.5rem]`}>
              {t('workPermit.hours.table.colYear')}
            </th>
            <th rowSpan={2} scope="col" className={headerCell}>
              {t('workPermit.hours.table.colKoreanCriteria')}
            </th>
            <th rowSpan={2} scope="col" className={`${headerCell} min-w-[3rem]`}>
              {t('workPermit.hours.table.colMet')}
            </th>
            <th colSpan={2} scope="colgroup" className={headerCell}>
              {t('workPermit.hours.table.colAllowedHours')}
            </th>
            <th rowSpan={2} scope="col" className={`${headerCell} min-w-[5.5rem] whitespace-pre-line text-[11px]`}>
              {t('workPermit.hours.table.colBonus')}
            </th>
          </tr>
          <tr>
            <th scope="col" className={headerCell}>
              {t('workPermit.hours.table.colWeekday')}
            </th>
            <th scope="col" className={headerCell}>
              {t('workPermit.hours.table.colWeekend')}
            </th>
          </tr>
        </thead>
        <tbody>
          {HOUR_BLOCKS.map((block) => (
            <Fragment key={block.id}>
              <tr>
                <td rowSpan={2} className={bodyCell}>
                  {t(block.courseKey)}
                </td>
                <td rowSpan={2} className={bodyCell}>
                  {t(block.yearKey)}
                </td>
                <td rowSpan={2} className={`${bodyCell} min-w-[9rem] whitespace-pre-line text-left text-[11px]`}>
                  {t(block.criteriaKey)}
                </td>
                <td className={bodyCell}>{t('workPermit.hours.table.notMet')}</td>
                <td colSpan={2} className={bodyCell}>
                  {t(block.notMetHoursKey)}
                </td>
                <td className={bodyCell}>{t(block.notMetHoursKey)}</td>
              </tr>
              <tr>
                <td className={bodyCell}>{t('workPermit.hours.table.met')}</td>
                <td className={bodyCell}>{t(block.metWeekdayKey)}</td>
                <td className={bodyCell}>{t(block.metWeekendKey)}</td>
                <td className={bodyCell}>{t(block.bonusKey)}</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
