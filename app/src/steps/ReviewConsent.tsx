import { useEffect, useRef, type ReactNode } from 'react'
import { ClipboardCheck, Receipt, PenLine, Pencil, CheckCircle2, Printer, RotateCcw, FileCheck2, Eraser, Type } from 'lucide-react'
import { useStore } from '../store'
import { Btn, Card, Check, Note } from '../components/ui'
import { RATE_OPTIONS, emi, estimateCharges, num, rs } from '../lib/finance'

/* ---------------- review summary ---------------- */

function Block({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  const s = useStore()
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        <button type="button" onClick={() => s.go(step)} className="text-xs text-[#E11D25] hover:underline flex items-center gap-1"><Pencil size={12} /> Edit</button>
      </div>
      <dl className="text-sm space-y-1">{children}</dl>
    </div>
  )
}
const Row = ({ k, v }: { k: string; v?: ReactNode }) => (
  <div className="flex justify-between gap-4"><dt className="text-gray-500">{k}</dt><dd className="text-gray-900 text-right font-medium">{v || '—'}</dd></div>
)

function Summary() {
  const s = useStore()
  const d = s.data
  const joint = d.joint === 'yes'
  const l = d.loan
  const rate = RATE_OPTIONS.find(r => String(r.years) === l.rateFixed)
  const monthly = rate ? emi(num(l.amount), rate.rate, num(l.years)) : 0
  const names = [d.a[0].fullName, joint ? d.a[1].fullName : ''].filter(Boolean).join(' & ')
  const income = [0, 1].reduce((t, i) => t + Object.values(d.inc).reduce((x, v) => x + (i === 1 && !joint ? 0 : num(v[i])), 0), 0)
  const spend = [0, 1].reduce((t, i) => t + Object.values(d.exp).reduce((x, v) => x + (i === 1 && !joint ? 0 : num(v[i])), 0), 0)
  const filled = (rows: Record<string, unknown>[], none: boolean) => (none ? 0 : rows.filter(r => Object.values(r).some(v => v && v !== 'Savings' && v !== '0')).length)
  const liab = d.noLiabilities ? [] : d.liabilities.filter(r => r.creditor)
  return (
    <Card icon={<ClipboardCheck size={26} />} title="Review your application" subtitle="Everything below was captured in the previous steps. Use Edit to change anything.">
      <div className="grid md:grid-cols-2 gap-4">
        <Block title="1 · Applicant / s" step={0}>
          <Row k={joint ? 'Applicants' : 'Applicant'} v={names} />
          <Row k="NIC" v={[d.a[0].idNo, joint ? d.a[1].idNo : ''].filter(Boolean).join(' / ')} />
          <Row k="Mobile" v={d.a[0].mobile} />
          <Row k="Address" v={d.a[0].address} />
        </Block>
        <Block title="2 · Employment" step={1}>
          <Row k="Employer" v={d.e[0].employer} />
          <Row k="Designation" v={d.e[0].designation} />
          <Row k="Net salary" v={d.e[0].netSalary && rs(num(d.e[0].netSalary))} />
          {joint && <Row k="Spouse net salary" v={d.e[1].netSalary && rs(num(d.e[1].netSalary))} />}
        </Block>
        <Block title="4 · Loan" step={2}>
          <Row k="Purpose" v={l.purpose} />
          <Row k="Amount" v={l.amount && rs(num(l.amount))} />
          <Row k="Tenure / rate fixed" v={l.years && rate ? `${l.years} yrs · fixed ${rate.label} @ ${rate.rate}%` : ''} />
          <Row k="Est. monthly instalment" v={monthly ? rs(monthly) : ''} />
        </Block>
        <Block title="5 · Security" step={2}>
          <Row k="Location" v={d.security.location} />
          <Row k="Owner" v={d.security.owner} />
          <Row k="Market value" v={d.security.marketValue && rs(num(d.security.marketValue))} />
          <Row k="Possession" v={d.security.possession} />
        </Block>
        <Block title="3 · 8 · 10 · Assets & liabilities" step={3}>
          <Row k="Properties / vehicles" v={filled(d.assets.property, d.assets.noProperty)} />
          <Row k="Bank accounts" v={filled(d.assets.banks, d.assets.noBanks)} />
          <Row k="Existing facilities" v={liab.length} />
          <Row k="Monthly repayments" v={liab.length ? rs(liab.reduce((t, r) => t + num(r.monthly), 0)) : ''} />
        </Block>
        <Block title="6 · 7 · Income & tax" step={4}>
          <Row k="Total monthly income" v={income ? rs(income) : ''} />
          <Row k="Total monthly expenditure" v={spend ? rs(spend) : ''} />
          <Row k="Tax years provided" v={d.noTax[0] ? 'Not an assessee' : d.tax.filter(t => (t.stat as string[])[0]).length + ' of 3'} />
        </Block>
      </div>
    </Card>
  )
}

/* ---------------- section 11 : charges ---------------- */

function Charges() {
  const s = useStore()
  const l = s.data.loan
  const condo = l.purpose === 'Purchase of a condominium apartment'
  const construction = ['Construct a house', 'Purchase of land and construct a house', 'Renovations & Repairs'].includes(l.purpose)
  const loan = num(l.amount)
  const lines = loan ? estimateCharges({ loan, propertyValue: num(s.data.security.marketValue) || num(l.price), condo, construction }) : []
  const total = lines.reduce((t, c) => t + (c.amount ?? 0), 0)
  const th = 'px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-100'
  const td = 'px-3 py-2 text-sm border-t border-gray-100 align-top'

  return (
    <Card icon={<Receipt size={26} />} section="Section 11" title="Charges to be Borne by the Applicant"
      subtitle="For your information. These are payable in addition to the loan instalments.">
      {lines.length > 0 && (
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Estimated upfront charges for your loan of {rs(loan)}</p>
          <div className="space-y-1 text-sm">
            {lines.map(c => (
              <div key={c.label} className="flex justify-between gap-4">
                <span className="text-gray-700">{c.label}{c.note && <span className="text-gray-400 text-xs"> · {c.note}</span>}</span>
                <span className="font-medium">{c.amount === null ? 'Negotiable' : rs(c.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-red-200 pt-2 mt-2 font-bold"><span>Estimated total (before taxes)</span><span className="text-[#E11D25]">{rs(total)}</span></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Excludes government taxes, stamp duty, travelling fees, Mortgage Protection Policy and Fire Insurance premiums — confirmed upon loan finalization.</p>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full min-w-[560px]">
          <thead><tr><th className={th}>Charge</th><th className={th}>Basis</th></tr></thead>
          <tbody>
            <tr><td className={td + ' font-medium w-1/3'}>Mortgage bond charges</td><td className={td}>
              <ul className="space-y-0.5">
                <li>Up to LKR 5.0 Mio — <b>1%</b> (minimum LKR 10,000 for MBDs of LKR 1.0 Mio and below)</li>
                <li>LKR 5,000,001 – 25,000,000 — LKR 50,000 + <b>0.5%</b> on the remaining balance</li>
                <li>LKR 25,000,001 &amp; above — LKR 150,000 + <b>0.25%</b> on the remaining balance</li>
                <li>Condominium properties — additional LKR 20,000</li>
                <li className="text-gray-500">+ all government taxes</li>
              </ul></td></tr>
            <tr><td className={td + ' font-medium'}>Title report charges</td><td className={td}>LKR 7,500 <span className="text-gray-500">(condominium: LKR 10,000)</span> + all government taxes</td></tr>
            <tr><td className={td + ' font-medium'}>Mortgage Protection Policy (MPP)</td><td className={td}>Depends on the approved amount, borrower's age &amp; health. To be confirmed upon loan finalization.</td></tr>
            <tr><td className={td + ' font-medium'}>Fire insurance (if applicable)</td><td className={td}>Depends on the valuation / construction cost. To be confirmed upon loan finalization.</td></tr>
            <tr><td className={td + ' font-medium'}>Valuation fee</td><td className={td}>
              <table className="text-xs w-full max-w-md">
                <thead><tr className="text-gray-500"><th className="text-left font-medium pb-1">Valuation amount</th><th className="text-left font-medium pb-1">Rate</th><th className="text-right font-medium pb-1">Max. cumulative</th></tr></thead>
                <tbody>
                  {[['Up to Rs. 1 Mn', 'Rs. 5,000 minimum', 'Rs. 5,000'], ['Above 1 Mn up to 20 Mn', 'Rs. 750 per million', 'Rs. 19,250'], ['Above 20 Mn up to 50 Mn', 'Rs. 500 per million', 'Rs. 34,250'],
                    ['Above 50 Mn up to 100 Mn', 'Rs. 250 per million', 'Rs. 46,750'], ['Above 100 Mn up to 500 Mn', 'Rs. 100 per million', 'Rs. 86,750'], ['Above 500 Mn', 'Negotiable', '—']].map(r => (
                    <tr key={r[0]} className="border-t border-gray-100"><td className="py-1 pr-3">{r[0]}</td><td className="pr-3">{r[1]}</td><td className="text-right">{r[2]}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-1">+ travelling fee + all government taxes</p></td></tr>
            <tr><td className={td + ' font-medium'}>Processing fee</td><td className={td}>0.5% of the loan value (minimum LKR 25,000 / maximum LKR 300,000) + all government taxes</td></tr>
            <tr><td className={td + ' font-medium'}>Inspection fee</td><td className={td}>
              <ul className="space-y-0.5"><li>1) Property inspection — flat fee of LKR 3,000</li><li>2) Construction stage inspections — LKR 3,000 at each inspection</li></ul>
              <p className="text-xs text-gray-500 mt-1">Transport to be provided by the customer, or actual cost will be recovered in addition to the inspection fee.</p></td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">All taxes &amp; stamp duty wherever applicable will be additionally recovered.</p>
    </Card>
  )
}

/* ---------------- signature ---------------- */

function SignaturePad({ i, name }: { i: 0 | 1; name: string }) {
  const s = useStore()
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const path = `consent.sig.${i}`
  const value: string = s.data.consent.sig[i]
  const typed = value.startsWith('typed:')

  // repaint a saved drawing when the pad is (re)mounted
  useEffect(() => {
    const c = canvas.current
    if (!c || !value || typed) return
    const img = new Image()
    img.onload = () => c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
    img.src = value
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * canvas.current!.width, y: ((e.clientY - r.top) / r.height) * canvas.current!.height }
  }
  const down = (e: React.PointerEvent) => {
    if (typed) return
    drawing.current = true
    canvas.current!.setPointerCapture(e.pointerId)
    const ctx = canvas.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1f2937'
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvas.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineTo(x, y); ctx.stroke()
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    s.set(path, canvas.current!.toDataURL('image/png'))
  }
  const clear = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, 600, 160)
    s.set(path, '')
  }
  const err = (s.attempted[5] && !value)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{i === 0 ? 'Applicant 1' : 'Applicant 2 / Spouse'} — signature <span className="text-red-500">*</span></span>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => s.set(path, `typed:${name}`)} className="text-gray-500 hover:text-[#E11D25] flex items-center gap-1"><Type size={12} /> Type my name</button>
          <button type="button" onClick={clear} className="text-gray-500 hover:text-[#E11D25] flex items-center gap-1"><Eraser size={12} /> Clear</button>
        </div>
      </div>
      <div className={`relative border-2 border-dashed rounded-lg bg-white ${err ? 'border-red-400 bg-red-50' : value ? 'border-emerald-300' : 'border-gray-300'}`}>
        {typed ? (
          <div className="h-[110px] flex items-center justify-center text-3xl text-gray-800" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>{value.slice(6)}</div>
        ) : (
          <canvas ref={canvas} width={600} height={160} className="w-full h-[110px] touch-none cursor-crosshair"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        )}
        {!value && <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none">Sign here with your mouse or finger</span>}
      </div>
      {err && <p className="text-xs text-red-600 mt-1.5">Signature required</p>}
    </div>
  )
}

function Consent() {
  const s = useStore()
  const joint = s.data.joint === 'yes'
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <Card icon={<PenLine size={26} />} section="Declaration" title="Declaration & Consent" subtitle="Please read carefully before signing.">
      <div className="text-sm text-gray-700 space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 leading-relaxed">
        <p>I / We certify that the above information is true and correct and that I / We have not knowingly withheld any information that might affect the credit decisions. I / We undertake to notify the Bank in writing any material changes in my / our financial position in the future. I / We authorise you to debit my / our nominated account (or any other account held with you, if the nominated account holds insufficient funds) for all charges, repayments and interest payable in relation to the loan.</p>
        <p>The undersigned expressly authorise the Bank to obtain from his employer or from any other sources such information as may be desired in connection with this application and each such source is hereby authorised to provide this Bank with such information as may be requested, and further agree that this application shall be and remain the property of Seylan Bank whether or not any facility is granted to the undersigned.</p>
        <p>I / We understand that any rate negotiated is subject to change and is valid for 30 days or until the next rate revision, whichever occurs first.</p>
      </div>
      <Check path="consent.declaration" label="I / We have read and understood the charges in Section 11 and agree to the declaration above." />
      <div className={`grid gap-5 ${joint ? 'md:grid-cols-2' : 'max-w-xl'}`}>
        <SignaturePad i={0} name={s.data.a[0].fullName || 'Applicant 1'} />
        {joint && <SignaturePad i={1} name={s.data.a[1].fullName || 'Applicant 2'} />}
      </div>
      <p className="text-sm text-gray-600 mt-4">Date: <b>{today}</b></p>
    </Card>
  )
}

export default function ReviewConsent() {
  return (
    <>
      <Summary />
      <Charges />
      <Consent />
    </>
  )
}

/* ---------------- submitted ---------------- */

export function Success() {
  const s = useStore()
  const d = s.data
  const construction = ['Construct a house', 'Purchase of land and construct a house', 'Renovations & Repairs'].includes(d.loan.purpose)
  const buyingHouse = ['Purchase of a house', 'Purchase of a condominium apartment'].includes(d.loan.purpose)
  const docs: [string, boolean][] = [
    ['NIC / passport copies', s.done.nic !== undefined || s.done.lookup !== undefined],
    ['Latest 3 payslips / salary letter', s.done.payslip !== undefined],
    ['Bank statements (6 months)', s.done.bankStmt !== undefined],
    ['Income tax assessments (3 years)', s.done.taxReturn !== undefined || d.noTax[0]],
    ['CRIB report (consent given)', s.done.crib !== undefined],
    ...(buyingHouse ? [['Sale agreement / title deed', s.done.saleAgreement !== undefined] as [string, boolean]] : []),
    ...(construction ? [['Approved building plan & BOQ', false] as [string, boolean]] : []),
  ]
  const timeline = ['Application received', 'Document verification', 'Valuation & inspection arranged', 'Credit decision', 'Letter of offer']
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 text-center mb-6">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Application submitted</h2>
        <p className="text-gray-600 mt-2">Thank you, {d.a[0].fullName || 'applicant'}. A Seylan Bank housing loan officer will contact you within 1 working day.</p>
        <div className="inline-block mt-5 bg-gray-50 border border-gray-200 rounded-lg px-6 py-3">
          <p className="text-xs text-gray-500">Reference number</p>
          <p className="text-2xl font-bold tracking-wider text-[#E11D25]">{s.submitted}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Loan amount</p><p className="font-semibold">{rs(num(d.loan.amount))}</p></div>
          <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Tenure</p><p className="font-semibold">{d.loan.years} years</p></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FileCheck2 size={18} className="text-[#E11D25]" /> Document checklist</h3>
          <ul className="space-y-2 text-sm">
            {docs.map(([t, ok]) => (
              <li key={t} className="flex items-start gap-2">
                {ok ? <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" /> : <span className="w-4 h-4 mt-0.5 rounded-full border-2 border-gray-300 shrink-0" />}
                <span className={ok ? 'text-gray-700' : 'text-gray-900'}>{t}{!ok && <span className="text-xs text-amber-700"> — please hand over at your branch</span>}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3">What happens next</h3>
          <ol className="space-y-3 text-sm">
            {timeline.map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${i === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i === 0 ? '✓' : i + 1}</span>
                <span className={i === 0 ? 'font-semibold' : 'text-gray-700'}>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Btn variant="outline" onClick={() => window.print()}><Printer size={16} /> Print summary</Btn>
        <Btn onClick={() => s.reset()}><RotateCcw size={16} /> Start a new application</Btn>
      </div>
    </div>
  )
}
