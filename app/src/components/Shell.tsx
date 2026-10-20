import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Zap, Wand2, RotateCcw, FastForward, X } from 'lucide-react'
import { STEPS, useStore } from '../store'
import { Btn } from './ui'
import { useActions } from './SmartFill'

export function Header() {
  return (
    <header className="bg-white border-b-[3px] border-[#E11D25] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Horizontal full-colour logo on white, per the Seylan logo usage guide */}
        <img src={`${import.meta.env.BASE_URL}seylan-logo.svg`} alt="Seylan Bank" className="h-14 md:h-16 w-auto" />
        <div className="text-right">
          <p className="text-xs md:text-sm font-semibold text-[#606060]">Digital Housing Loan Application</p>
          <p className="text-[11px] md:text-xs mt-0.5 text-[#606060]/80">Secure &amp; Fast</p>
        </div>
      </div>
    </header>
  )
}

export function Stepper() {
  const s = useStore()
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => {
            const done = i < s.step
            const cur = i === s.step
            const clickable = i <= s.maxStep && !cur
            return (
              <div key={label} className="contents">
                <button type="button" disabled={!clickable} onClick={() => s.go(i)}
                  className={`flex flex-col items-center ${clickable ? 'cursor-pointer' : 'cursor-default'}`}>
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all text-sm ${done ? 'bg-green-500 text-white' : cur ? 'bg-[#E11D25] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? <Check size={18} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center hidden md:block max-w-[80px] ${cur ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-1.5 ${i < s.step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
        <p className="md:hidden text-center text-sm font-semibold text-gray-800 mt-3">Step {s.step + 1} of {STEPS.length} · {STEPS[s.step]}</p>
      </div>
    </div>
  )
}

export function AutoFillBar() {
  const s = useStore()
  if (!s.autoCount || s.submitted) return null
  const mins = Math.max(1, Math.round((s.autoCount * 7) / 60))
  return (
    <div className="bg-emerald-50 border-b border-emerald-200">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-emerald-800">
        <Zap size={16} className="shrink-0" />
        <span><b>{s.autoCount}</b> fields filled automatically — about <b>{mins} min</b> of typing saved. Green fields can still be edited.</span>
      </div>
    </div>
  )
}

export function NavButtons({ onNext, nextLabel = 'Next', nextIcon = true }: { onNext: () => void; nextLabel?: string; nextIcon?: boolean }) {
  const s = useStore()
  return (
    <div className="flex justify-between mt-2 mb-10">
      <button type="button" disabled={s.step === 0} onClick={() => s.go(s.step - 1)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={20} /> Previous
      </button>
      <button type="button" onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E11D25] text-white hover:bg-[#801D25] transition-colors">
        {nextLabel} {nextIcon && <ChevronRight size={20} />}
      </button>
    </div>
  )
}

/** Presenter shortcuts – not part of the customer journey. */
export function DemoTools() {
  const s = useStore()
  const actions = useActions()
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {open ? (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Demo tools</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <Btn variant="soft" className="!justify-start !py-2 text-sm" onClick={() => { actions.everything(); setOpen(false) }}>
              <Wand2 size={15} /> Fill whole application
            </Btn>
            <Btn variant="ghost" className="!justify-start !py-2 text-sm" onClick={() => { s.go(5); setOpen(false) }}>
              <FastForward size={15} /> Jump to review
            </Btn>
            <Btn variant="ghost" className="!justify-start !py-2 text-sm" onClick={() => { s.reset(); setOpen(false) }}>
              <RotateCcw size={15} /> Reset demo
            </Btn>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-gray-900 flex items-center gap-1.5">
          <Wand2 size={14} /> Demo tools
        </button>
      )}
    </div>
  )
}
