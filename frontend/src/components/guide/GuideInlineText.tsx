import { parseGuideStep } from '@/i18n/guide/parseStep'

function renderTextWithBold(text: string, keyPrefix: string) {
  const segments = text.split(/\*\*(.+?)\*\*/g)

  return segments.map((segment, index) => {
    if (!segment) return null
    const isBold = index % 2 === 1
    if (isBold) {
      return (
        <strong key={`${keyPrefix}-bold-${index}`} className="font-semibold text-pnu-text">
          {segment}
        </strong>
      )
    }
    return <span key={`${keyPrefix}-text-${index}`}>{segment}</span>
  })
}

export function GuideInlineText({ text }: { text: string }) {
  return (
    <>
      {parseGuideStep(text).map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={`${part.href}-${index}`}
              href={part.href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-pnu-blue underline decoration-pnu-blue/30 underline-offset-2 hover:text-pnu-blue-light"
            >
              {part.label}
            </a>
          )
        }

        return (
          <span key={`text-${index}`}>{renderTextWithBold(part.value, `part-${index}`)}</span>
        )
      })}
    </>
  )
}
