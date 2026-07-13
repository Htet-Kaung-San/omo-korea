/** Canonical English checklist titles → i18n keys */
const TITLE_KEYS: Record<string, string> = {
  'Apply for Alien Registration Card (ARC)': 'checklistTask.arc.title',
  'Open Local Korean Bank Account': 'checklistTask.bank.title',
  'Open local bank account': 'checklistTask.bank.title',
  'Register and Open Mobile SIM Card': 'checklistTask.sim.title',
  'Buy PNU SIM card': 'checklistTask.sim.title',
  'Submit Health Clearance Certificate to Dormitory': 'checklistTask.health.title',
  'Submit graduation thesis outline': 'checklistTask.thesis.title',
  'TOPIK Level 4 certificate': 'checklistTask.topik.title',
  'Completed credit audit': 'checklistTask.creditAudit.title',
  'Alien registration': 'checklistTask.arc.title',
  'Bank account': 'checklistTask.bank.title',
  'SIM card': 'checklistTask.sim.title',
}

const DESCRIPTION_KEYS: Record<string, string> = {
  'Visit immigration office within 90 days of arrival': 'checklistTask.arc.desc',
  'Visit immigration office within 90 days': 'checklistTask.arc.desc',
  'Open account at PNU campus bank': 'checklistTask.bank.desc',
  'For scholarship and living expenses': 'checklistTask.bank.desc',
  'Get a local prepaid or contract SIM card': 'checklistTask.sim.desc',
  'Apply for your 외국인등록증 at the local immigration office within 90 days of arrival.':
    'checklistTask.arc.desc',
  'Open a local bank account for tuition payments and daily expenses.': 'checklistTask.bank.desc',
  'Get a Korean mobile plan for campus alerts and two-factor authentication.':
    'checklistTask.sim.desc',
  'Submit thesis outline to department office': 'checklistTask.thesis.desc',
  'Submit outline to academic office': 'checklistTask.thesis.desc',
  'Submit language proficiency certificate': 'checklistTask.topik.desc',
  'Language requirement': 'checklistTask.topik.desc',
  'Verify graduation credit breakdown with academic advisor': 'checklistTask.creditAudit.desc',
}

type TranslateFn = (key: string) => string

function lookup(text: string, map: Record<string, string>, t: TranslateFn): string {
  const trimmed = text.trim()
  if (!trimmed) return text
  const key = map[trimmed]
  if (!key) return text
  const translated = t(key)
  return translated === key ? text : translated
}

/** Localize known checklist titles/descriptions by the stored English canonical text. */
export function localizeChecklistText(text: string, t: TranslateFn): string {
  const fromTitle = lookup(text, TITLE_KEYS, t)
  if (fromTitle !== text) return fromTitle
  return lookup(text, DESCRIPTION_KEYS, t)
}
