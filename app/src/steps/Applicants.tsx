import { useEffect, useState } from 'react'
import { Users, UserPlus, CheckCircle2, Smartphone, Loader2 } from 'lucide-react'
import { useStore } from '../store'
import { Btn, Card, Check, Choice, Grid, Note, Text, Area, YesNo } from '../components/ui'
import { sleep, useActions } from '../components/SmartFill'
import { askNotificationPermission, sendSms } from '../components/SmsPopup'
import { DEMO_NIC, DEMO_SPOUSE_NIC } from '../data/demo'
import { ageFromDob, parseNic } from '../lib/nic'


const normMobile = (raw: string) => {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('94')) d = '0' + d.slice(2)
  return /^07\d{8}$/.test(d) ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : ''
}

/** Mobile OTP (arrives as a pop-up "SMS") followed by NIC lookup against one hardcoded customer record. */
function VerifyCard() {
  const s = useStore()
  const actions = useActions()
  const { mobile, verified, nic } = s.data.verify
  const [sentCode, setSentCode] = useState('')
  const [otp, setOtp] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const fetched = s.done.lookup !== undefined

  const send = () => {
    const m = normMobile(mobile)
    if (!m) return setMsg('Enter a valid Sri Lankan mobile number, e.g. 077 123 4567.')
    askNotificationPermission()
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(code)
    setOtp('')
    setMsg('')
    s.set('verify.mobile', m)
    sendSms(m, `Your Seylan Bank verification code is ${code}. Valid for 5 minutes. Do not share it with anyone.`)
  }
  const verifyOtp = () => {
    if (otp === sentCode && sentCode) { s.set('verify.verified', true); setSentCode(''); setMsg('') }
    else setMsg('That code is not correct. Please try again.')
  }
  const fetchProfile = async () => {
    const id = nic.trim().toUpperCase()
    if (!parseNic(id).valid) return setMsg('Enter a valid NIC – 9 digits + V, or 12 digits.')
    setMsg('')
    setBusy(true)
    await sleep(1300)
    if (id === DEMO_NIC) {
      actions.lookup()
      s.fill({ 'a.0.mobile': mobile }, 'Verified')
    } else {
      s.fill({ 'a.0.idNo': id, 'a.0.mobile': mobile }, 'Verified')
      setMsg('No Seylan customer record found for this NIC. Your NIC and mobile number are filled in — please complete the rest below.')
    }
    setBusy(false)
  }

  return (
    <Card icon={<Smartphone size={26} />} title="Verify your mobile number"
      subtitle="We'll text you a one-time code, then fetch your details from your NIC so you don't have to type them.">
      <div className="max-w-2xl">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={mobile} inputMode="tel" placeholder="07X XXX XXXX"
            onChange={e => { s.set('verify.mobile', e.target.value); if (verified) s.set('verify.verified', false) }}
            className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#E11D25] outline-none ${verified ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-300'}`} />
          {verified ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium px-2"><CheckCircle2 size={18} /> Verified</span>
          ) : (
            <Btn onClick={send}>{sentCode ? 'Resend OTP' : 'Send OTP'}</Btn>
          )}
        </div>

        {sentCode && !verified && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter the 6-digit code we sent to {mobile}</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="6-digit OTP"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E11D25] outline-none tracking-widest" />
              <Btn onClick={verifyOtp}>Verify</Btn>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Demo: the code appears as a message pop-up at the top right of the screen.</p>
          </div>
        )}

        <div className={`mt-6 pt-5 border-t border-gray-200 transition-opacity ${verified ? '' : 'opacity-40 pointer-events-none'}`}>
          {fetched ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} /> Details found for NIC {nic || DEMO_NIC} — your application has been pre-filled. Please review each step.
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your NIC number</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={nic} onChange={e => s.set('verify.nic', e.target.value.trim())} placeholder="XXXXXXXXXV or 123456789012"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E11D25] outline-none" />
                <Btn onClick={() => void fetchProfile()} disabled={busy}>
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Fetching…</> : 'Fetch my details'}
                </Btn>
              </div>
              <button type="button" onClick={() => s.set('verify.nic', DEMO_NIC)} className="text-xs text-gray-500 underline mt-2 hover:text-[#E11D25]">
                Use demo NIC ({DEMO_NIC})
              </button>
            </>
          )}
        </div>
        {msg && <p className="text-sm text-amber-700 mt-3">{msg}</p>}
      </div>
    </Card>
  )
}

function SpouseFetch() {
  const s = useStore()
  const actions = useActions()
  const [nic, setNic] = useState('')
  const [msg, setMsg] = useState('')
  if (s.done.spouse !== undefined) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 mb-5">
        <CheckCircle2 size={18} /> Spouse details fetched — {s.done.spouse} fields filled (personal, employer, accounts)
      </div>
    )
  }
  const go = () => {
    if (!parseNic(nic).valid) return setMsg('Enter a valid NIC.')
    if (nic.toUpperCase() !== DEMO_SPOUSE_NIC) return setMsg('No Seylan profile found — fill in the details below (date of birth is derived from the NIC).')
    actions.spouse()
  }
  return (
    <div className="rounded-lg border border-red-100 bg-red-50/60 px-4 py-3 mb-5">
      <p className="text-sm text-gray-800 mb-2 flex items-center gap-2"><UserPlus size={16} className="text-[#E11D25]" /> <b>Fetch spouse in one step</b> — enter their NIC; they confirm by OTP.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={nic} onChange={e => { setNic(e.target.value.trim()); setMsg('') }} placeholder="Spouse NIC"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E11D25] outline-none bg-white text-sm" />
        <Btn onClick={go} className="!py-2 text-sm">Fetch details</Btn>
      </div>
      <button type="button" onClick={() => setNic(DEMO_SPOUSE_NIC)} className="text-xs text-gray-500 underline mt-1.5 hover:text-[#E11D25]">Use demo NIC ({DEMO_SPOUSE_NIC})</button>
      {msg && <p className="text-xs text-amber-700 mt-1.5">{msg}</p>}
    </div>
  )
}

function Person({ i, cols }: { i: 0 | 1; cols: 1 | 2 }) {
  const s = useStore()
  const a = s.data.a[i]
  const p = `a.${i}`
  const married = a.civil === 'Married'
  const age = ageFromDob(a.dob)
  const sameAddr = i === 1 && s.data.sameAddress
  return (
    <div className={cols === 1 ? 'border border-gray-200 rounded-lg p-5 bg-white' : 'max-w-2xl'}>
      {cols === 1 && (
        <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{i === 0 ? 'Applicant 1' : 'Applicant 2 / Spouse'}</h3>
      )}
      {i === 1 && <SpouseFetch />}
      <Choice path={`${p}.idType`} label="Identity document" options={['NIC', 'Passport']} />
      <Text path={`${p}.idNo`} label={a.idType === 'Passport' ? 'Passport No.' : 'National ID card No.'} required
        placeholder={a.idType === 'Passport' ? 'N1234567' : 'XXXXXXXXXV or 123456789012'}
        hint={a.idType === 'NIC' ? 'Date of birth and title are filled in from the NIC' : undefined} />
      <Choice path={`${p}.title`} label="Title" required options={['Mr', 'Mrs', 'Miss', 'Dr', 'Rev']} />
      <Text path={`${p}.fullName`} label="Full name" required placeholder="As per NIC / Passport" />
      <Text path={`${p}.dob`} label="Date of birth" required type="date"
        hint={age !== null ? `Age ${age}` : 'Must be 18 years or above'} />
      {sameAddr ? (
        <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Residential address &amp; telephone — same as Applicant 1</p>
          <p className="text-xs mt-0.5 text-emerald-800">{s.data.a[0].address || '—'}</p>
        </div>
      ) : (
        <>
          <Area path={`${p}.address`} label="Residential address" required placeholder="Enter complete residential address" />
          <Text path={`${p}.phone`} label="Residential tel. no." type="tel" placeholder="011 XXX XXXX" />
        </>
      )}
      <Grid cols={cols}>
        <Text path={`${p}.mobile`} label="Mobile no." required type="tel" placeholder="07X XXX XXXX" />
        <Text path={`${p}.email`} label="E-mail address" type="email" placeholder="your.email@example.com" />
      </Grid>
      <Choice path={`${p}.civil`} label="Civil status" required options={['Single', 'Married']} />
      {married && (
        <Grid cols={cols}>
          <Text path={`${p}.children`} label="Number of children" type="number" placeholder="0" />
          <Text path={`${p}.dependents`} label="Other dependents" type="number" placeholder="0" />
        </Grid>
      )}
      <YesNo path={`${p}.slCitizen`} label="Are you a citizen of Sri Lanka?" required />
      {a.slCitizen === 'Yes' && <YesNo path={`${p}.dual`} label="Dual citizenship holder?" />}
      {a.dual === 'Yes' && a.slCitizen === 'Yes' && <Text path={`${p}.dualCountries`} label="Name of countries" placeholder="e.g. Australia" />}
      <YesNo path={`${p}.pr`} label="Are you a PR holder?" />
      {a.pr === 'Yes' && <Text path={`${p}.prCountry`} label="Name of the country" placeholder="e.g. Canada" />}
    </div>
  )
}

export default function Applicants() {
  const s = useStore()
  const joint = s.data.joint === 'yes'
  const [a0, a1] = s.data.a

  // NIC → date of birth + title (Sri Lankan NICs encode both)
  useEffect(() => {
    ;([0, 1] as const).forEach(i => {
      const a = s.data.a[i]
      if (a.idType !== 'NIC') return
      const info = parseNic(a.idNo)
      if (!info.valid) return
      const entries: Record<string, unknown> = {}
      if ((!a.dob || s.src[`a.${i}.dob`] === 'From NIC') && a.dob !== info.dob) entries[`a.${i}.dob`] = info.dob
      if (Object.keys(entries).length) s.fill(entries, 'From NIC')
      if (!a.title) s.fill({ [`a.${i}.title`]: info.gender === 'Male' ? 'Mr' : a.civil === 'Married' ? 'Mrs' : 'Miss' }, 'From NIC')
    })
  }, [a0.idNo, a1.idNo, a0.idType, a1.idType]) // eslint-disable-line react-hooks/exhaustive-deps

  // spouse living at the same address
  useEffect(() => {
    if (!joint || !s.data.sameAddress) return
    const e: Record<string, unknown> = {}
    if (a1.address !== a0.address) e['a.1.address'] = a0.address
    if (a1.phone !== a0.phone) e['a.1.phone'] = a0.phone
    if (Object.keys(e).length) s.fill(e, 'Same as Applicant 1')
  }, [joint, s.data.sameAddress, a0.address, a0.phone]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <VerifyCard />
      <Card icon={<Users size={26} />} section="Section 1" title="Details of Applicant / s" subtitle="Tell us who is applying. Most of this can be filled automatically from your NIC.">
        <Choice path="joint" label="Is your spouse a joint applicant?" required
          options={[{ value: 'no', label: 'No – I am applying alone' }, { value: 'yes', label: 'Yes – spouse is a joint applicant' }]}
          onChange={v => { if (v === 'yes') s.fill({ 'a.0.civil': 'Married', 'a.1.civil': 'Married' }, 'Joint application') }} />
        {joint && <Check path="sameAddress" label="Spouse lives at the same address (copies address & telephone from Applicant 1)" />}
        {joint ? (
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            <Person i={0} cols={1} />
            <Person i={1} cols={1} />
          </div>
        ) : (
          <Person i={0} cols={2} />
        )}
      </Card>
      {s.data.joint === '' && <Note>Choose whether your spouse is a joint applicant. Their details are only asked for if they are.</Note>}
    </>
  )
}
