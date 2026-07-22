interface GuideTableProps {
  headers: string[]
  rows: string[][]
  caption?: string
}

export function GuideTable({ headers, rows, caption }: GuideTableProps) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-pnu-border">
      <table className="min-w-full text-left text-xs">
        {caption ? (
          <caption className="px-3 py-2 text-left text-xs font-semibold text-pnu-text">{caption}</caption>
        ) : null}
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="whitespace-nowrap px-3 py-2 font-semibold text-pnu-text"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-pnu-border">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top leading-relaxed text-pnu-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
