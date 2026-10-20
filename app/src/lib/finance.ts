// Indicative figures for the demo only – not real Seylan Bank pricing.

export const RATE_OPTIONS = [
  { years: 1, label: '1 year', rate: 10.75 },
  { years: 2, label: '2 years', rate: 11.25 },
  { years: 5, label: '5 years', rate: 11.75 },
  { years: 10, label: '10 years', rate: 12.25 },
]

export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export const fmt = (n: number, dp = 0) =>
  n.toLocaleString('en-LK', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const rs = (n: number) => `Rs. ${fmt(Math.round(n))}`

export function emi(principal: number, annualRatePct: number, years: number): number {
  if (!principal || !years) return 0
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (!r) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ---- Section 11 – charges to be borne by the applicant (from the application form) ----

export function mortgageBondCharge(loan: number, condo: boolean): number {
  let c: number
  if (loan <= 5_000_000) {
    c = loan * 0.01
    if (loan <= 1_000_000) c = Math.max(c, 10_000)
  } else if (loan <= 25_000_000) {
    c = 50_000 + (loan - 5_000_000) * 0.005
  } else {
    c = 150_000 + (loan - 25_000_000) * 0.0025
  }
  return c + (condo ? 20_000 : 0)
}

export const titleReportCharge = (condo: boolean) => (condo ? 10_000 : 7_500)

export function valuationFee(value: number): number | null {
  const M = 1_000_000
  if (value <= 0) return 0
  if (value <= 1 * M) return 5_000
  const mn = value / M
  if (mn <= 20) return 5_000 + (mn - 1) * 750
  if (mn <= 50) return 19_250 + (mn - 20) * 500
  if (mn <= 100) return 34_250 + (mn - 50) * 250
  if (mn <= 500) return 46_750 + (mn - 100) * 100
  return null // negotiable
}

export const processingFee = (loan: number) => Math.min(300_000, Math.max(25_000, loan * 0.005))

export interface ChargeLine {
  label: string
  note?: string
  amount: number | null
}

export function estimateCharges(opts: {
  loan: number
  propertyValue: number
  condo: boolean
  construction: boolean
}): ChargeLine[] {
  const { loan, propertyValue, condo, construction } = opts
  const val = valuationFee(propertyValue || loan)
  return [
    { label: 'Mortgage bond charges', note: condo ? 'incl. LKR 20,000 condominium add-on' : undefined, amount: mortgageBondCharge(loan, condo) },
    { label: 'Title report charges', amount: titleReportCharge(condo) },
    { label: 'Processing fee', note: '0.5% of loan (min 25,000 / max 300,000)', amount: processingFee(loan) },
    { label: 'Valuation fee', note: val === null ? 'Negotiable above Rs. 500 Mn' : 'plus travelling fee', amount: val },
    { label: 'Property inspection', note: construction ? 'flat fee; construction stage inspections LKR 3,000 each' : 'flat fee', amount: 3_000 },
  ]
}
