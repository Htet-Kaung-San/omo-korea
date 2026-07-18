import { parseGuideStep } from '@/i18n/guide/parseStep'

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

        return <span key={`text-${index}`}>{part.value}</span>
      })}
    </>
  )
}
