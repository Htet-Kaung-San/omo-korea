import { PageHeader } from '@/components/layout/PageHeader'
import { workPermit } from '@/data/support'

export function WorkPermitPage() {
  return (
    <div>
      <PageHeader title="Part-time Work Permit Guide" back />

      <div className="space-y-4 px-5 py-5">
        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed text-pnu-text">{workPermit.intro}</p>
        </section>

        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-pnu-text">Eligibility</h2>
          <ul className="mt-3 space-y-2">
            {workPermit.eligibility.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-pnu-muted">
                • {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-pnu-text">Steps</h2>
          <ol className="mt-3 space-y-2">
            {workPermit.steps.map((step, index) => (
              <li key={step} className="flex gap-2 text-sm leading-relaxed text-pnu-muted">
                <span className="font-bold text-pnu-blue">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
