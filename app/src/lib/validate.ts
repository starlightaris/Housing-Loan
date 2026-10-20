import type { AppData } from '../store'
import { parseNic, ageFromDob } from './nic'
import { num } from './finance'

const REQ = 'Required'
const PURCHASE = ['Purchase of bare land', 'Purchase of a house', 'Purchase of land and construct a house', 'Purchase of a condominium apartment']
export const isPurchase = (p: string) => PURCHASE.includes(p)
export const needsSellerConsent = (p: string) => ['Purchase of a house', 'Purchase of a condominium apartment'].includes(p)
export const needsEstCost = (p: string) => ['Construct a house', 'Purchase of land and construct a house', 'Renovations & Repairs'].includes(p)

export function validate(step: number, d: AppData): Record<string, string> {
  const e: Record<string, string> = {}
  const need = (path: string, v: unknown, msg = REQ) => { if (v === '' || v === undefined || v === null || v === false) e[path] = msg }
  const joint = d.joint === 'yes'

  if (step === 0) {
    need('joint', d.joint)
    for (let i = 0; i < (joint ? 2 : 1); i++) {
      const a = d.a[i]
      const p = `a.${i}`
      need(`${p}.title`, a.title)
      need(`${p}.fullName`, a.fullName)
      need(`${p}.dob`, a.dob)
      if (a.dob && (ageFromDob(a.dob) ?? 99) < 18) e[`${p}.dob`] = 'Must be 18 years or above'
      need(`${p}.address`, a.address)
      need(`${p}.mobile`, a.mobile)
      if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) e[`${p}.email`] = 'Enter a valid e-mail address'
      need(`${p}.idNo`, a.idNo)
      if (a.idNo && a.idType === 'NIC' && !parseNic(a.idNo).valid) e[`${p}.idNo`] = 'Enter a valid NIC (123456789V or 12 digits)'
      need(`${p}.civil`, a.civil)
      need(`${p}.slCitizen`, a.slCitizen)
    }
  }
  if (step === 1) {
    for (let i = 0; i < (joint ? 2 : 1); i++) {
      const x = d.e[i]
      const p = `e.${i}`
      need(`${p}.employer`, x.employer)
      need(`${p}.designation`, x.designation)
      need(`${p}.years`, x.years)
      need(`${p}.netSalary`, x.netSalary)
      need(`${p}.salaryAssigned`, x.salaryAssigned)
    }
    need('abroad.employed', d.abroad.employed)
    if (d.abroad.employed === 'Yes') {
      need('abroad.country', d.abroad.country)
      need('abroad.recovery', d.abroad.recovery)
    }
  }
  if (step === 2) {
    const l = d.loan
    need('loan.purpose', l.purpose)
    need('loan.amount', l.amount)
    need('loan.rateFixed', l.rateFixed)
    need('loan.years', l.years)
    if (l.purpose && isPurchase(l.purpose)) need('loan.price', l.price)
    if (l.purpose && needsEstCost(l.purpose)) need('loan.estCost', l.estCost)
    if (l.purpose === 'Redemption of an existing housing loan') need('loan.redeemFrom', l.redeemFrom)
    if (l.price && l.amount && num(l.amount) > num(l.price) + num(l.estCost)) e['loan.amount'] = 'Loan cannot exceed the total cost'
    const s = d.security
    need('security.location', s.location)
    need('security.owner', s.owner)
    need('security.extent', s.extent)
    need('security.marketValue', s.marketValue)
    need('security.possession', s.possession)
    if (needsSellerConsent(l.purpose) && !s.sellerConsent) e['security.sellerConsent'] = "Seller's written consent is mandatory for purchases"
  }
  if (step === 5) {
    need('consent.declaration', d.consent.declaration, 'Please accept the declaration to continue')
    need('consent.sig.0', d.consent.sig[0], 'Applicant 1 signature required')
    if (joint) need('consent.sig.1', d.consent.sig[1], 'Applicant 2 signature required')
  }
  return e
}
