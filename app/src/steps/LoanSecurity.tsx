import { useState } from 'react'
import { Home, ShieldCheck, Calculator } from 'lucide-react'
import { useStore } from '../store'
import { Card, Check, Choice, FieldShell, Grid, Money, Note, SubHead, Text, YesNo, useErr } from '../components/ui'
import { DocBanner } from '../components/SmartFill'
import { RATE_OPTIONS, emi, fmt, num, rs } from '../lib/finance'
import { needsEstCost, needsSellerConsent } from '../lib/validate'

export const PURPOSES = [
  'Purchase of bare land', 'Construct a house', 'Purchase of a house', 'Purchase of land and construct a house',
  'Purchase of a condominium apartment', 'Renovations & Repairs', 'Redemption of an existing housing loan',
]

const AUTHORITIES = [
  'Colombo MC', 'Dehiwala – Mt. Lavinia MC', 'Sri Jayawardenepura Kotte MC', 'Moratuwa MC', 'Kaduwela MC', 'Negombo MC',
  'Kandy MC', 'Galle MC', 'Maharagama UC', 'Kesbewa UC', 'Homagama PS', 'Kelaniya PS', 'Biyagama PS',
]

function LoanSummary() {
  const s = useStore()
  const l = s.data.loan
  const rate = RATE_OPTIONS.find(r => String(r.years) === l.rateFixed)?.rate
  const amount = num(l.amount)
  const years = num(l.years)
  const monthly = rate ? emi(amount, rate, years) : 0
  const total = num(l.price) + num(l.estCost)
  const contribution = Math.max(0, total - amount)
  const ltv = total ? Math.round((amount / total) * 100) : 0

  const joint = s.data.joint === 'yes'
  const income = num(s.data.e[0].netSalary) + (joint ? num(s.data.e[1].netSalary) : 0)
  const obligations = s.data.noLiabilities ? 0 : s.data.liabilities.reduce((t, r) => t + num(r.monthly), 0)
  const dbr = income ? Math.round(((monthly + obligations) / income) * 100) : 0
  const tone = dbr <= 50 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : dbr <= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'

  if (!amount || !rate || !years) {
    return <Note>Choose a loan amount, repayment period and rate period to see your estimated monthly instalment.</Note>
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3"><Calculator size={16} className="text-[#E11D25]" /> Your estimate</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><p className="text-gray-500 text-xs">Monthly instalment</p><p className="font-bold text-lg text-[#E11D25]">{rs(monthly)}</p><p className="text-[11px] text-gray-400">at {rate}% (indicative)</p></div>
        <div><p className="text-gray-500 text-xs">Total cost of project</p><p className="font-semibold">{total ? rs(total) : '—'}</p></div>
        <div><p className="text-gray-500 text-xs">Your contribution (4.7)</p><p className="font-semibold">{total ? `${rs(contribution)}` : '—'}</p>{total > 0 && <p className="text-[11px] text-gray-400">Loan = {ltv}% of cost</p>}</div>
        <div>
          <p className="text-gray-500 text-xs">Income used for repayments</p>
          {income ? <p className={`inline-block border rounded-md px-2 py-0.5 font-semibold ${tone}`}>{dbr}%</p> : <p className="text-gray-400">—</p>}
          <p className="text-[11px] text-gray-400">EMI + existing ÷ net salary</p>
        </div>
      </div>
    </div>
  )
}

function LoanCard() {
  const s = useStore()
  const yearsErr = useErr('loan.years')
  const l = s.data.loan
  const p = l.purpose
  const landOnly = p === 'Purchase of bare land'
  const construct = ['Construct a house', 'Purchase of land and construct a house'].includes(p)
  const renovate = p === 'Renovations & Repairs'
  const redeem = p === 'Redemption of an existing housing loan'
  const landInvolved = ['Purchase of bare land', 'Purchase of land and construct a house'].includes(p)
  const buying = ['Purchase of a house', 'Purchase of a condominium apartment'].includes(p)
  const hasBuilding = !!p && !landOnly && !redeem
  const total = num(l.price) + num(l.estCost)

  return (
    <Card icon={<Home size={26} />} section="Section 4" title="Loan Details" subtitle="How much you need, for what, and how you'd like to repay.">
      <Choice path="loan.purpose" label="4.4 Purpose of loan" required options={PURPOSES} />
      {redeem && <Text path="loan.redeemFrom" label="Existing housing loan to be redeemed from" required placeholder="Bank / financial institution" />}

      <Grid cols={2}>
        {(landOnly || buying || p === 'Purchase of land and construct a house') && (
          <Money path="loan.price" label={p === 'Purchase of land and construct a house' ? '4.5 Purchase price of land' : '4.5 Purchase price'} required />
        )}
        {redeem && <Money path="loan.price" label="Outstanding balance to be redeemed" />}
        {needsEstCost(p) && <Money path="loan.estCost" label="4.6 Total estimated cost (construction / repair / renovation)" required />}
        {needsEstCost(p) && <Text path="loan.boqBy" label="BOQ prepared by" placeholder="Engineer / QS / contractor" />}
      </Grid>

      <SubHead>Loan amount &amp; repayment</SubHead>
      <div className="max-w-2xl">
        <Money path="loan.amount" label="4.1 Loan amount required" required />
        {total > 0 && (
          <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Quick pick:</span>
            {[50, 60, 70, 80].map(pc => (
              <button key={pc} type="button" onClick={() => s.fill({ 'loan.amount': String(Math.round((total * pc) / 100 / 1000) * 1000) }, 'Suggested')}
                className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:border-[#E11D25] hover:text-[#E11D25] bg-white">{pc}% of cost · {rs(Math.round((total * pc) / 100 / 1000) * 1000)}</button>
            ))}
          </div>
        )}
        <Choice path="loan.rateFixed" label="4.2 Interest rate to be fixed for" required
          options={RATE_OPTIONS.map(r => ({ value: String(r.years), label: `${r.label} · ${r.rate}%` }))}
          hint="Indicative rates for this demo. Any rate negotiated is valid for 30 days or until the next rate revision." />
        <FieldShell label="4.3 No. of years required for repayment" required error={yearsErr} source={s.src['loan.years']}>
          <div className="flex items-center gap-4">
            <input type="range" min={1} max={30} value={l.years || 15} onChange={e => s.set('loan.years', e.target.value)} className="flex-1" />
            <span className="w-24 text-center font-semibold border border-gray-300 rounded-lg py-2 bg-white">{l.years ? `${l.years} yrs` : '—'}</span>
          </div>
        </FieldShell>
      </div>
      <LoanSummary />

      {(landInvolved || buying || construct || renovate) && (
        <>
          <SubHead>Payments made so far &amp; project details</SubHead>
          <Grid cols={2}>
            {(landInvolved || buying) && <Money path="loan.spentLand" label={buying ? '4.8 Advance payments already made' : '4.8 Already spent – to purchase the land'} />}
            {(construct || renovate) && <Money path="loan.spentConstruction" label="4.8 Already spent – for construction" />}
            {construct && <Text path="loan.grace" label="Grace period if required (months)" type="number" placeholder="0" />}
            {hasBuilding && (
              <FieldShell label="4.9 Floor area of house to be purchased / constructed">
                <div className="flex gap-2">
                  <div className="flex-1"><Text path="loan.floorArea" compact placeholder="0" /></div>
                  <select value={l.floorUnit} onChange={e => s.set('loan.floorUnit', e.target.value)} className="border border-gray-300 rounded-lg px-3 text-sm bg-white">
                    <option>Sq. ft</option><option>Sq. M</option>
                  </select>
                </div>
              </FieldShell>
            )}
          </Grid>
          {hasBuilding && <YesNo path="loan.planApproved" label="Is the building plan approved by the Local Authority?" />}
          {buying && <YesNo path="loan.coc" label="Has the Certificate of Conformity (COC) been obtained?" />}
        </>
      )}
    </Card>
  )
}

function SecurityCard() {
  const s = useStore()
  const sec = s.data.security
  const purpose = s.data.loan.purpose
  const owned = (s.data.assets.property ?? []).map((r, i) => ({ r, i })).filter(({ r }) => r.address && !/axio|car|vehicle|van|cab/i.test(r.address + r.desc))
  const [pick, setPick] = useState('')
  const names = [s.data.a[0].fullName, s.data.joint === 'yes' ? s.data.a[1].fullName : ''].filter(Boolean)

  const usePick = (v: string) => {
    setPick(v)
    const row = s.data.assets.property[parseInt(v, 10)]
    if (!row) return
    s.fill({ 'security.location': row.address, 'security.extent': row.desc.replace(/^.*?–\s*/, ''), 'security.owner': row.owner, 'security.marketValue': row.value }, 'From my assets (3.1)')
  }

  return (
    <Card icon={<ShieldCheck size={26} />} section="Section 5" title="Property Offered as Security" subtitle="The property that will be mortgaged to the bank.">
      {owned.length > 0 && (
        <div className="mb-5 max-w-2xl">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">…or the property is one I already own (from your declared assets)</label>
          <select value={pick} onChange={e => usePick(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#E11D25] outline-none">
            <option value="">Select a property</option>
            {owned.map(({ r, i }) => <option key={i} value={i}>{r.address} — {r.desc}</option>)}
          </select>
        </div>
      )}
      <datalist id="authorities">{AUTHORITIES.map(a => <option key={a} value={a} />)}</datalist>
      <Grid cols={2}>
        <Text path="security.location" label="Location" required placeholder="Address of the property" />
        <Text path="security.authority" label="Local authority" list="authorities" placeholder="Start typing…" />
        <Text path="security.landName" label="Name of land" />
        <Text path="security.extent" label="Extent" required placeholder="e.g. 10 perches" />
        <Text path="security.planNo" label="Plan no." />
        <Text path="security.lotNo" label="Lot no." />
        <Text path="security.floorArea" label="Floor area of building, if any (sq. ft.)" type="number" />
        <Money path="security.marketValue" label="Present market value" required />
      </Grid>
      <div className="max-w-2xl">
        <Text path="security.owner" label="Name of property owner" required placeholder="Full name of the registered owner" />
        {names.length > 0 && (
          <div className="-mt-3 mb-5 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Owner is:</span>
            {names.map((n, i) => (
              <button key={n} type="button" onClick={() => s.fill({ 'security.owner': n }, 'Applicant')}
                className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:border-[#E11D25] hover:text-[#E11D25] bg-white">Applicant {i + 1} · {n}</button>
            ))}
          </div>
        )}
        <Text path="security.lifeInterest" label="Name of the life interest holder (if any)" />
        <Choice path="security.possession" label="Current possession" required options={['Vacant', 'Occupied', 'Tenanted']} />
        {sec.possession && sec.possession !== 'Vacant' && <Text path="security.occupiedBy" label={sec.possession === 'Tenanted' ? 'Tenant (please specify)' : 'Occupied by (please specify)'} />}
        {needsSellerConsent(purpose) && (
          <Check path="security.sellerConsent">
            <b> Seller's consent. </b>Written consent from the seller to hand over vacant possession at the time of signing the transfer deed is mandatory.
          </Check>
        )}
      </div>
    </Card>
  )
}

export default function LoanSecurity() {
  return (
    <>
      <DocBanner docKey="saleAgreement">
        <b>Buying a property?</b> Upload the sale agreement / title deed — purpose, price, plan &amp; lot no., extent, owner and local authority are read from it.
      </DocBanner>
      <LoanCard />
      <SecurityCard />
    </>
  )
}
