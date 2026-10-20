import { useEffect } from 'react'
import { Wallet, Receipt } from 'lucide-react'
import { EXPENSE_ROWS, INCOME_ROWS, TAX_FIELDS, TAX_YEARS, useStore } from '../store'
import { Card, Check, Money, Note } from '../components/ui'
import { DocBanner } from '../components/SmartFill'
import { num, rs } from '../lib/finance'

function Table({ title, rows, base, joint, totalLabel }: {
  title: string; rows: readonly (readonly [string, string])[]; base: 'inc' | 'exp'; joint: boolean; totalLabel: string
}) {
  const s = useStore()
  const cols = joint ? 'grid-cols-[minmax(0,1fr)_92px_92px] md:grid-cols-[1fr_170px_170px]' : 'grid-cols-[minmax(0,1fr)_130px] md:grid-cols-[1fr_200px]'
  const total = (i: number) => rows.reduce((t, [k]) => t + num(s.data[base][k][i]), 0)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={`grid ${cols} bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide`}>
        <div className="px-3 py-2">{title}</div>
        <div className="px-2 md:px-3 py-2 text-right">Appl. 1</div>
        {joint && <div className="px-2 md:px-3 py-2 text-right">Appl. 2</div>}
      </div>
      {rows.map(([k, label]) => (
        <div key={k} className={`grid ${cols} items-center border-t border-gray-100`}>
          <div className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-700">{label}</div>
          <div className="px-1 md:px-2 py-1"><Money path={`${base}.${k}.0`} compact /></div>
          {joint && <div className="px-1 md:px-2 py-1"><Money path={`${base}.${k}.1`} compact /></div>}
        </div>
      ))}
      <div className={`grid ${cols} items-center border-t-2 border-gray-300 bg-gray-50 font-semibold text-sm`}>
        <div className="px-3 py-2.5">{totalLabel}</div>
        <div className="px-2 md:px-3 py-2.5 text-right text-xs md:text-sm">{rs(total(0))}</div>
        {joint && <div className="px-2 md:px-3 py-2.5 text-right text-xs md:text-sm">{rs(total(1))}</div>}
      </div>
    </div>
  )
}

export default function IncomeTax() {
  const s = useStore()
  const d = s.data
  const joint = d.joint === 'yes'

  // Employment income defaults from section 2 – only overwrites values we filled ourselves.
  useEffect(() => {
    ;([0, 1] as const).forEach(i => {
      if (i === 1 && !joint) return
      const sal = d.e[i].netSalary
      const cur = d.inc.basic[i]
      const auto = !!s.src[`inc.basic.${i}`]
      if (sal && (!cur || (auto && s.src[`inc.basic.${i}`] === 'From section 2')) && cur !== sal && !d.inc.alw[i]) s.fill({ [`inc.basic.${i}`]: sal }, 'From section 2')
    })
  }, [d.e[0].netSalary, d.e[1].netSalary, joint]) // eslint-disable-line react-hooks/exhaustive-deps

  // Loan / card repayments come straight from section 8.
  const sums = [0, 1].map(i => {
    const rows = d.noLiabilities ? [] : d.liabilities.filter(r => r.holder === String(i))
    return {
      loans: rows.filter(r => r.purpose !== 'Credit card').reduce((t, r) => t + num(r.monthly), 0),
      cards: rows.filter(r => r.purpose === 'Credit card').reduce((t, r) => t + num(r.monthly), 0),
    }
  })
  const sig = JSON.stringify(sums)
  useEffect(() => {
    const e: Record<string, unknown> = {}
    sums.forEach((v, i) => {
      ;(['loans', 'cards'] as const).forEach(k => {
        const path = `exp.${k}.${i}`
        const cur = d.exp[k][i]
        const mine = !cur || s.src[path] === 'From section 8'
        if (mine && v[k] && String(v[k]) !== cur) e[path] = String(v[k])
      })
    })
    if (Object.keys(e).length) s.fill(e, 'From section 8')
  }, [sig]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalOf = (base: 'inc' | 'exp', rows: readonly (readonly [string, string])[], i: number) => rows.reduce((t, [k]) => t + num(d[base][k][i]), 0)
  const net = [0, 1].map(i => totalOf('inc', INCOME_ROWS, i) - totalOf('exp', EXPENSE_ROWS, i))
  const allNoTax = d.noTax[0] && (!joint || d.noTax[1])

  return (
    <>
      <Card icon={<Wallet size={26} />} section="Section 6" title="Monthly Income & Expenditure"
        subtitle="Per month, in Rs. Documentary evidence is required for income.">
        <h3 className="font-semibold text-gray-800 mb-3">Income</h3>
        <Table title="Source" rows={INCOME_ROWS} base="inc" joint={joint} totalLabel="Total income" />
        <p className="text-xs text-gray-500 mt-2 mb-6">* Allowances that are fixed and regularly paid. Salary is carried over from section 2 when available.</p>

        <h3 className="font-semibold text-gray-800 mb-3">Expenditure</h3>
        <DocBanner docKey="bankStmt">Upload a bank statement — we estimate your monthly expenses from the last 6 months of spending.</DocBanner>
        <Table title="Details" rows={EXPENSE_ROWS} base="exp" joint={joint} totalLabel="Total expenditure" />
        <p className="text-xs text-gray-500 mt-2">Loan and credit-card repayments are taken from section 8 automatically.</p>

        <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700">Net monthly surplus</span>
          <span className={`text-lg font-bold ${net[0] + (joint ? net[1] : 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{rs(net[0] + (joint ? net[1] : 0))}</span>
        </div>
      </Card>

      <Card icon={<Receipt size={26} />} section="Section 7" title="Particulars of Income Tax — Last Three Years"
        subtitle="Documentary evidence to be provided.">
        <DocBanner docKey="taxReturn">Upload your tax assessment notice — all three years are filled in for you.</DocBanner>
        <div className="flex flex-wrap gap-x-6">
          <Check path="noTax.0" label="Applicant 1 is not an income tax assessee" className="!mb-3" />
          {joint && <Check path="noTax.1" label="Applicant 2 is not an income tax assessee" className="!mb-3" />}
        </div>
        {allNoTax ? (
          <Note tone="ok">Nothing to enter here.</Note>
        ) : (
          <div className={`grid gap-4 ${joint ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
            {TAX_YEARS.map((y, yi) => (
              <div key={y} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className={`grid ${joint ? 'grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'} bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide`}>
                  <div className="px-3 py-2">Year {y}</div>
                  <div className="px-3 py-2 text-right">Applicant 1</div>
                  {joint && <div className="px-3 py-2 text-right">Applicant 2</div>}
                </div>
                {TAX_FIELDS.map(([k, label]) => (
                  <div key={k} className={`grid ${joint ? 'grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'} items-center border-t border-gray-100`}>
                    <div className="px-3 py-1.5 text-xs text-gray-700">{label}</div>
                    <div className="px-2 py-1"><Money path={`tax.${yi}.${k}.0`} compact /></div>
                    {joint && <div className="px-2 py-1"><Money path={`tax.${yi}.${k}.1`} compact /></div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
