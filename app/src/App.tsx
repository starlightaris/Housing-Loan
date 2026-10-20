import { useEffect } from 'react'
import { StoreProvider, STEPS, useStore } from './store'
import { validate } from './lib/validate'
import { ErrCtx } from './components/ui'
import { SmsPopup } from './components/SmsPopup'
import { DemoTools, Header, NavButtons, Stepper } from './components/Shell'
import Applicants from './steps/Applicants'
import Employment from './steps/Employment'
import LoanSecurity from './steps/LoanSecurity'
import AssetsLiabilities from './steps/AssetsLiabilities'
import IncomeTax from './steps/IncomeTax'
import ReviewConsent, { Success } from './steps/ReviewConsent'

const PAGES = [Applicants, Employment, LoanSecurity, AssetsLiabilities, IncomeTax, ReviewConsent]

function Shell() {
  const s = useStore()
  const errs = s.attempted[s.step] ? validate(s.step, s.data) : {}
  const Page = PAGES[s.step]
  const last = s.step === STEPS.length - 1

  // after a failed "Next", bring the first problem into view
  const errCount = Object.keys(errs).length
  useEffect(() => {
    if (!errCount) return
    const t = setTimeout(() => document.querySelector('.text-red-600')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
    return () => clearTimeout(t)
  }, [s.attempted[s.step]]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    // Demo mode: required-field checks are intentionally not enforced, so Next always works.
    if (last) s.submit(`HL-2026-${String(Math.floor(100000 + Math.random() * 899999))}`)
    else s.go(s.step + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {!s.submitted && <Stepper />}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {s.submitted ? (
          <Success />
        ) : (
          <ErrCtx.Provider value={errs}>
            <Page />
            {errCount > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm mb-4">
                Please complete the {errCount} highlighted field{errCount > 1 ? 's' : ''} above to continue.
              </div>
            )}
            <NavButtons onNext={next} nextLabel={last ? 'Submit Application' : 'Next'} nextIcon={!last} />
          </ErrCtx.Provider>
        )}
      </main>
      <footer className="text-center text-xs text-gray-400 pb-8 px-4">
        For demo purposes only
      </footer>
      <DemoTools />
      <SmsPopup />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
