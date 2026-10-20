import { useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Loader2, Upload, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { DEMO_LOAN, DOCS, docEntries, lookupEntries, spouseEntries } from '../data/demo'

const SOURCE: Record<string, string> = {
  nic: 'NIC scan', payslip: 'Payslip', bankStmt: 'Bank statement', saleAgreement: 'Sale agreement',
  taxReturn: 'Tax assessment', crib: 'CRIB report', lookup: 'Seylan profile', spouse: 'Seylan profile',
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Actions that simulate integrations; every one just pushes canned data through store.fill(). */
export function useActions() {
  const s = useStore()
  const run = (key: string, entries: Record<string, unknown>) => {
    const n = s.fill(entries, SOURCE[key])
    s.markDone(key, n)
    return n
  }
  return {
    lookup: () => run('lookup', lookupEntries(s.get)),
    spouse: () => run('spouse', spouseEntries(s.get)),
    doc: (key: string) => run(key, docEntries(key, s.get)),
    everything: () => {
      run('lookup', lookupEntries(s.get))
      run('spouse', spouseEntries(s.get))
      for (const d of DOCS) if (d.key !== 'nic') run(d.key, docEntries(d.key, s.get))
      s.fill(DEMO_LOAN, 'Suggested')
    },
  }
}

/** Upload-a-document button with a short fake "reading…" phase. */
export function DocButton({ docKey, size = 'md' }: { docKey: string; size?: 'sm' | 'md' }) {
  const s = useStore()
  const actions = useActions()
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const doc = DOCS.find(d => d.key === docKey)!
  const done = s.done[docKey]

  const go = async () => {
    setBusy(true)
    await sleep(1300)
    actions.doc(docKey)
    setBusy(false)
  }

  if (done !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 size={18} /> {docKey === 'crib' ? 'Fetched' : 'Read'} · {done} fields filled
      </span>
    )
  }
  if (busy) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-gray-600">
        <Loader2 size={16} className="animate-spin text-[#E11D25]" /> {docKey === 'crib' ? 'Fetching report…' : 'Reading document…'}
      </span>
    )
  }
  const pad = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  return (
    <span className="inline-flex items-center gap-3 flex-wrap">
      <input ref={input} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.length) void go() }} />
      <button type="button" onClick={() => (docKey === 'crib' ? void go() : input.current?.click())}
        className={`inline-flex items-center gap-2 rounded-lg border border-[#E11D25] text-[#E11D25] hover:bg-red-50 font-medium ${pad}`}>
        <Upload size={15} /> {docKey === 'crib' ? 'Fetch with my consent' : 'Upload'}
      </button>
      {docKey !== 'crib' && (
        <button type="button" onClick={() => void go()} className="text-xs text-gray-500 underline hover:text-[#E11D25]">use sample</button>
      )}
      <span className="sr-only">{doc.title}</span>
    </span>
  )
}

/** Slim "skip the typing" banner shown inside a step. Hides itself once the doc has been read. */
export function DocBanner({ docKey, children }: { docKey: string; children: ReactNode }) {
  const s = useStore()
  const done = s.done[docKey] !== undefined
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 mb-5 ${done ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50/60'}`}>
      <div className="flex items-center gap-3 text-sm text-gray-800">
        <Sparkles size={18} className={done ? 'text-emerald-600' : 'text-[#E11D25]'} />
        <span>{children}</span>
      </div>
      <DocButton docKey={docKey} size="sm" />
    </div>
  )
}
