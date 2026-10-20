import { Briefcase, Globe2 } from 'lucide-react'
import { useStore } from '../store'
import { Area, Card, Choice, Grid, Money, Note, Select, Text, YesNo } from '../components/ui'
import { DocBanner } from '../components/SmartFill'
import { num } from '../lib/finance'

function Job({ i, cols }: { i: 0 | 1; cols: 1 | 2 }) {
  const s = useStore()
  const e = s.data.e[i]
  const p = `e.${i}`
  const short = e.years !== '' && num(e.years) < 2
  return (
    <div className={cols === 1 ? 'border border-gray-200 rounded-lg p-5 bg-white' : 'max-w-2xl'}>
      {cols === 1 && (
        <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          {i === 0 ? s.data.a[0].fullName || 'Applicant 1' : s.data.a[1].fullName || 'Applicant 2 / Spouse'}
        </h3>
      )}
      <Text path={`${p}.employer`} label="Name of employer or business" required placeholder="Company / business name" />
      <Grid cols={cols}>
        <Text path={`${p}.designation`} label="Designation / profession" required />
        <Text path={`${p}.nature`} label="Nature of business" placeholder="e.g. Information Technology" />
        <Text path={`${p}.years`} label="No. of years with employer" required type="number" placeholder="0" />
        <Money path={`${p}.netSalary`} label="Net salary with fixed allowance (per month)" required />
      </Grid>
      <Area path={`${p}.address`} label="Address" placeholder="Employer / business address" />
      <Text path={`${p}.phone`} label="Telephone no. / s" type="tel" placeholder="011 XXX XXXX" />
      <YesNo path={`${p}.salaryAssigned`} label="Is your salary already assigned to Seylan Bank?" required />
      {e.salaryAssigned === 'No' && <YesNo path={`${p}.assignmentGiven`} label="Will an assignment over salary be given?" />}
      {short && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 mb-5">
          <p className="text-sm font-medium text-amber-900 mb-3">Less than 2 years with this employer — previous employment</p>
          <Text path={`${p}.prevEmployer`} label="Name of previous employer" />
          <Grid cols={cols}>
            <Text path={`${p}.prevPeriod`} label="Period of employment" placeholder="e.g. 2021 – 2024" />
            <Text path={`${p}.prevDesignation`} label="Designation / profession" />
          </Grid>
        </div>
      )}
    </div>
  )
}

export default function Employment() {
  const s = useStore()
  const joint = s.data.joint === 'yes'
  const ab = s.data.abroad
  return (
    <>
      <Card icon={<Briefcase size={26} />} section="Section 2" title="Details of Employment / Business"
        subtitle="Where you work and what you earn each month.">
        <DocBanner docKey="payslip">Upload your latest payslip — employer, designation and net salary are read from it.</DocBanner>
        {joint ? (
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            <Job i={0} cols={1} />
            <Job i={1} cols={1} />
          </div>
        ) : (
          <Job i={0} cols={2} />
        )}
      </Card>

      <Card icon={<Globe2 size={26} />} section="Section 9" title="Sri Lankans Employed Abroad" subtitle="Only if you currently work outside Sri Lanka.">
        <div className="max-w-2xl">
          <YesNo path="abroad.employed" label="Are you employed overseas?" required />
          {ab.employed === 'Yes' && (
            <>
              <Text path="abroad.country" label="Name of the country" required placeholder="e.g. United Arab Emirates" />
              <Choice path="abroad.recovery" label="Loan recovery will be done through" required
                options={[{ value: 'PFCA', label: 'PFCA – Personal Foreign Currency Account' }, { value: 'PLA', label: 'PLA – Personal Foreign Currency Loan Account' }]} />
              {ab.recovery === 'PFCA' && <Select path="abroad.currency" label="Currency" options={['USD', 'GBP', 'EUR']} />}
              {ab.recovery === 'PLA' && <Choice path="abroad.plaCurrency" label="Repayment in" options={['LKR', 'Inward foreign remittance']} />}
            </>
          )}
          {ab.employed === 'No' && <Note tone="ok">Not applicable — you can continue.</Note>}
        </div>
      </Card>
    </>
  )
}
