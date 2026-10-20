import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/* ------------------------------------------------------------------ */
/* Data model – mirrors sections 1-10 of the paper form                */
/* ------------------------------------------------------------------ */

export const newApplicant = () => ({
  title: '', fullName: '', dob: '', address: '', phone: '', mobile: '', email: '',
  idType: 'NIC', idNo: '', civil: '', children: '', dependents: '',
  slCitizen: '', dual: '', dualCountries: '', pr: '', prCountry: '',
})

export const newEmployment = () => ({
  employer: '', years: '', address: '', phone: '', nature: '', designation: '', netSalary: '',
  salaryAssigned: '', assignmentGiven: '', prevEmployer: '', prevPeriod: '', prevDesignation: '',
})

export const newProperty = () => ({ address: '', desc: '', owner: '', value: '', mortgage: '' })
export const newShare = () => ({ type: '', company: '', value: '', assignment: '' })
export const newPolicy = () => ({ holder: '', company: '', policyNo: '', face: '', premium: '', assignment: '' })
export const newBank = () => ({ bank: '', type: 'Savings', accNo: '', opened: '', balance: '', holder: '' })
export const newLiability = () => ({ creditor: '', borrowed: '', balance: '', monthly: '', security: '', period: '', purpose: '', holder: '0' })
export const newPast = () => ({ bank: '', branch: '', amount: '', granted: '', settled: '' })

export const INCOME_ROWS = [
  ['basic', 'Employment – Basic'], ['alw', 'Employment – Allowances*'], ['business', 'Business'],
  ['profession', 'Profession'], ['industry', 'Industry'], ['agri', 'Agriculture'],
  ['interest', 'Interest'], ['dividends', 'Dividends'], ['rent', 'Rent / Lease'],
] as const

export const EXPENSE_ROWS = [
  ['rent', 'House rent'], ['household', 'Household expenses'], ['education', "Children's education"],
  ['personal', 'Personal'], ['travel', 'Travelling'], ['medical', 'Medical'],
  ['loans', 'Loan repayment'], ['cards', 'Credit card payment'], ['rates', 'Rates & taxes'],
  ['utilities', 'Electricity & fuel'], ['insurance', 'Insurance'], ['dependents', 'Dependents'],
  ['others', 'Others'],
] as const

const pair = () => ['', '']
const rowMap = (keys: readonly (readonly [string, string])[]) =>
  Object.fromEntries(keys.map(([k]) => [k, pair()])) as Record<string, string[]>

export const TAX_YEARS = ['2023/24', '2024/25', '2025/26']
export const TAX_FIELDS = [
  ['stat', 'Statutory income'], ['assess', 'Assessable income'], ['taxable', 'Taxable income'],
  ['paid', 'Tax paid'], ['other', 'Other allowances'],
] as const

export const emptyData = () => ({
  verify: { mobile: '', verified: false, nic: '' },
  joint: '' as '' | 'yes' | 'no',
  sameAddress: true,
  a: [newApplicant(), newApplicant()],
  e: [newEmployment(), newEmployment()],
  abroad: { employed: '', country: '', recovery: '', currency: 'USD', plaCurrency: 'LKR' },
  assets: {
    property: [newProperty()], noProperty: false,
    shares: [newShare()], noShares: false,
    policies: [newPolicy()], noPolicies: false,
    banks: [newBank()], noBanks: false,
  },
  loan: {
    amount: '', rateFixed: '', years: '', purpose: '', redeemFrom: '', price: '', estCost: '', boqBy: '',
    spentLand: '', spentConstruction: '', grace: '', floorArea: '', floorUnit: 'Sq. ft', planApproved: '', coc: '',
  },
  security: {
    location: '', authority: '', planNo: '', lotNo: '', landName: '', extent: '', owner: '', floorArea: '',
    marketValue: '', lifeInterest: '', possession: '', occupiedBy: '', sellerConsent: false, condo: false,
  },
  inc: rowMap(INCOME_ROWS),
  exp: rowMap(EXPENSE_ROWS),
  noTax: [false, false],
  tax: TAX_YEARS.map(year => ({ year, ...Object.fromEntries(TAX_FIELDS.map(([k]) => [k, pair()])) })) as
    ({ year: string } & Record<string, string[] | string>)[],
  liabilities: [newLiability()], noLiabilities: false,
  past: [newPast()], noPast: false,
  consent: { declaration: false, crib: false, sig: ['', ''] },
})

export type AppData = ReturnType<typeof emptyData>

/* ------------------------------------------------------------------ */
/* Path helpers                                                        */
/* ------------------------------------------------------------------ */

export function getIn(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setIn<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const walk = (node: any, i: number): any => {
    const k = keys[i]
    const clone = Array.isArray(node) ? [...node] : { ...(node ?? {}) }
    clone[k] = i === keys.length - 1 ? value : walk(node?.[k], i + 1)
    return clone
  }
  return walk(obj, 0)
}

function leaves(prefix: string, value: unknown, out: Record<string, unknown>) {
  if (Array.isArray(value)) value.forEach((v, i) => leaves(`${prefix}.${i}`, v, out))
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => leaves(`${prefix}.${k}`, v, out))
  else if (value !== '' && value !== null && value !== undefined && value !== false) out[prefix] = value
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const STEPS = [
  'Applicants', 'Employment', 'Loan & Security', 'Assets & Liabilities', 'Income & Tax', 'Review & Consent',
] as const

interface Persisted {
  data: AppData
  src: Record<string, string>
  step: number
  maxStep: number
  done: Record<string, number>
  submitted: string | null
}

const KEY = 'seylan-hl-demo-v3'

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Persisted
      if (p && p.data && p.data.a) return p
    }
  } catch { /* ignore */ }
  return { data: emptyData(), src: {}, step: 0, maxStep: 0, done: {}, submitted: null }
}

interface Ctx extends Persisted {
  attempted: Record<number, boolean>
  get: (path: string) => any
  set: (path: string, value: unknown) => void
  /** Bulk-set values and remember where they came from (shown as an "auto-filled" badge). */
  fill: (entries: Record<string, unknown>, source: string) => number
  addRow: (listPath: string, row: unknown) => void
  removeRow: (listPath: string, idx: number) => void
  go: (step: number) => void
  attempt: (step: number) => void
  markDone: (key: string, filled: number) => void
  submit: (ref: string) => void
  reset: () => void
  autoCount: number
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [attempted, setAttempted] = useState<Record<number, boolean>>({})
  const stateRef = useRef(state)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // Apply synchronously against the ref so back-to-back fills (e.g. "fill everything") see each other's results.
  const update = useCallback((fn: (s: Persisted) => Persisted) => {
    const next = fn(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const clearSrc = (src: Record<string, string>, path: string) => {
    const next = { ...src }
    for (const k of Object.keys(next)) if (k === path || k.startsWith(path + '.')) delete next[k]
    return next
  }

  const api = useMemo<Ctx>(() => ({
    ...stateRef.current,
    attempted,
    get: (path: string) => getIn(stateRef.current.data, path),
    set: (path, value) => update(s => ({ ...s, data: setIn(s.data, path, value), src: clearSrc(s.src, path) })),
    fill: (entries, source) => {
      let count = 0
      for (const [path, value] of Object.entries(entries)) {
        const out: Record<string, unknown> = {}
        leaves(path, value, out)
        count += Object.keys(out).length
      }
      update(s => {
        let data = s.data
        let src = s.src
        for (const [path, value] of Object.entries(entries)) {
          data = setIn(data, path, value)
          src = clearSrc(src, path)
          const out: Record<string, unknown> = {}
          leaves(path, value, out)
          for (const k of Object.keys(out)) src[k] = source
        }
        return { ...s, data, src: { ...src } }
      })
      return count
    },
    addRow: (listPath, row) => update(s => {
      const list = getIn(s.data, listPath) as unknown[]
      return { ...s, data: setIn(s.data, listPath, [...list, row]) }
    }),
    removeRow: (listPath, idx) => update(s => {
      const list = (getIn(s.data, listPath) as unknown[]).filter((_, i) => i !== idx)
      // re-index provenance keys that belong to this list
      const src: Record<string, string> = {}
      for (const [k, v] of Object.entries(s.src)) {
        if (k.startsWith(listPath + '.')) {
          const rest = k.slice(listPath.length + 1)
          const [i, ...tail] = rest.split('.')
          const n = parseInt(i, 10)
          if (n === idx) continue
          src[`${listPath}.${n > idx ? n - 1 : n}${tail.length ? '.' + tail.join('.') : ''}`] = v
        } else src[k] = v
      }
      return { ...s, data: setIn(s.data, listPath, list), src }
    }),
    go: step => {
      update(s => ({ ...s, step, maxStep: Math.max(s.maxStep, step) }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    attempt: step => setAttempted(a => ({ ...a, [step]: true })),
    markDone: (key, filled) => update(s => ({ ...s, done: { ...s.done, [key]: filled } })),
    submit: ref => update(s => ({ ...s, submitted: ref })),
    reset: () => {
      setAttempted({})
      update(() => ({ data: emptyData(), src: {}, step: 0, maxStep: 0, done: {}, submitted: null }))
      window.scrollTo({ top: 0 })
    },
    autoCount: Object.keys(stateRef.current.src).length,
  }), [state, attempted, update])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}
