import { Building2, Landmark, History } from 'lucide-react'
import { newBank, newLiability, newPast, newPolicy, newProperty, newShare, useStore } from '../store'
import { Card, Choice, Grid, Money, Repeater, Select, Text } from '../components/ui'
import { DocBanner } from '../components/SmartFill'

function useNames() {
  const s = useStore()
  const joint = s.data.joint === 'yes'
  const n = [s.data.a[0].fullName || 'Applicant 1']
  if (joint) n.push(s.data.a[1].fullName || 'Applicant 2')
  return n
}

export default function AssetsLiabilities() {
  const names = useNames()
  const owners = [...names, ...(names.length > 1 ? ['Jointly'] : [])]
  const holderOpts = names.map((n, i) => ({ value: String(i), label: n }))

  return (
    <>
      <Card icon={<Building2 size={26} />} section="Section 3" title="Particulars of Assets Owned"
        subtitle="Assets owned by the applicant/s and spouse. Declare everything held in your name or your spouse's.">
        <h3 className="font-semibold text-gray-800 mb-3">3.1 Lands, buildings &amp; motor vehicles</h3>
        <Repeater listPath="assets.property" noneKey="assets.noProperty" noneLabel="I / we own none of these" newRow={newProperty} addLabel="Add property / vehicle" rowTitle="Asset">
          {p => (
            <Grid cols={2}>
              <Text path={`${p}.address`} label="Address" />
              <Text path={`${p}.desc`} label="Description (floor area, extent, etc.)" />
              <Select path={`${p}.owner`} label="Owned by" options={owners} allowOther />
              <Money path={`${p}.value`} label="Market value" />
              <Text path={`${p}.mortgage`} label="Mortgages (if any)" className="md:col-span-2" />
            </Grid>
          )}
        </Repeater>

        <h3 className="font-semibold text-gray-800 mb-3 mt-8">3.2 Shares / Treasury bills</h3>
        <Repeater listPath="assets.shares" noneKey="assets.noShares" noneLabel="I / we hold none of these" newRow={newShare} addLabel="Add shares / T-bills" rowTitle="Holding">
          {p => (
            <Grid cols={2}>
              <Select path={`${p}.type`} label="Type" options={['Shares', 'Treasury Bills', 'Treasury Bonds', 'Debentures', 'Unit trusts']} allowOther />
              <Text path={`${p}.company`} label="Name of company" />
              <Money path={`${p}.value`} label="Value of treasury bills / shares" />
              <Text path={`${p}.assignment`} label="Assignments (if any)" />
            </Grid>
          )}
        </Repeater>

        <h3 className="font-semibold text-gray-800 mb-3 mt-8">3.3 Life insurance policies</h3>
        <Repeater listPath="assets.policies" noneKey="assets.noPolicies" noneLabel="I / we have no life insurance policies" newRow={newPolicy} addLabel="Add policy" rowTitle="Policy">
          {p => (
            <Grid cols={2}>
              <Select path={`${p}.holder`} label="Name of policy holder" options={owners} allowOther />
              <Text path={`${p}.company`} label="Name of company" />
              <Text path={`${p}.policyNo`} label="Policy no." />
              <Money path={`${p}.face`} label="Face value" />
              <Text path={`${p}.premium`} label="Premium Rs. & frequency" placeholder="e.g. 4,500 / monthly" />
              <Text path={`${p}.assignment`} label="Assignments (if any)" />
            </Grid>
          )}
        </Repeater>

        <h3 className="font-semibold text-gray-800 mb-3 mt-8">3.4 Bank accounts</h3>
        <Repeater listPath="assets.banks" noneKey="assets.noBanks" noneLabel="I / we have no bank accounts" newRow={newBank} addLabel="Add account" rowTitle="Account">
          {p => (
            <Grid cols={2}>
              <Text path={`${p}.bank`} label="Name of the bank / branch" />
              <Choice path={`${p}.type`} label="Type of account" options={['Savings', 'Current']} />
              <Text path={`${p}.accNo`} label="Account no." />
              <Text path={`${p}.opened`} label="Date account opened" type="date" />
              <Money path={`${p}.balance`} label="Present balance" />
              <Select path={`${p}.holder`} label="Name of the account holder" options={owners} allowOther />
            </Grid>
          )}
        </Repeater>
      </Card>

      <Card icon={<Landmark size={26} />} section="Section 8" title="Existing Liabilities"
        subtitle="All loans, hire purchase contracts, leases & credit card facilities applied for or obtained by you and your spouse, from this Bank or other lenders.">
        <DocBanner docKey="crib">Fetch your CRIB report (with your consent) — every existing facility is listed for you; just confirm.</DocBanner>
        <Repeater listPath="liabilities" noneKey="noLiabilities" noneLabel="I / we have no existing liabilities" newRow={newLiability} addLabel="Add facility" rowTitle="Facility">
          {p => (
            <Grid cols={3}>
              <Text path={`${p}.creditor`} label="Name of creditor" className="md:col-span-2" />
              <Select path={`${p}.purpose`} label="Purpose" options={['Housing', 'Personal', 'Vehicle / Leasing', 'Credit card', 'Education', 'Business', 'Other']} allowOther />
              <Money path={`${p}.borrowed`} label="Amount borrowed / limit" />
              <Money path={`${p}.balance`} label="Balance payable now" />
              <Money path={`${p}.monthly`} label="Monthly instalment" />
              <Text path={`${p}.security`} label="Security" />
              <Text path={`${p}.period`} label="Repayable period (remaining)" />
              <Select path={`${p}.holder`} label="Borrower" options={holderOpts} placeholder="—" />
            </Grid>
          )}
        </Repeater>
      </Card>

      <Card icon={<History size={26} />} section="Section 10" title="Facilities Enjoyed in the Past (since settled)"
        subtitle="Facilities from this Bank or any other bank / financial institution that have been settled. Filled from the CRIB report if fetched above.">
        <Repeater listPath="past" noneKey="noPast" noneLabel="I / we have no previously settled facilities" newRow={newPast} addLabel="Add facility" rowTitle="Facility">
          {p => (
            <Grid cols={3}>
              <Text path={`${p}.bank`} label="Bank" />
              <Text path={`${p}.branch`} label="Branch" />
              <Money path={`${p}.amount`} label="Amount" />
              <Text path={`${p}.granted`} label="Year granted" type="number" placeholder="YYYY" />
              <Text path={`${p}.settled`} label="Year settled" type="number" placeholder="YYYY" />
            </Grid>
          )}
        </Repeater>
      </Card>
    </>
  )
}
