// All data below is fictional and exists only to simulate what a real integration
// (core banking profile, document OCR, CRIB, IRD) would return.

type Get = (path: string) => any

export const DEMO_NIC = '199014602345'
export const DEMO_SPOUSE_NIC = '199272701234'
export const DEMO_OTP = '123456'

export interface DocDef {
  key: string
  title: string
  hint: string
  fills: string
}

export const DOCS: DocDef[] = [
  { key: 'nic', title: 'NIC (front & back)', hint: 'Photo of your National ID card', fills: 'Name, date of birth, NIC no., address' },
  { key: 'payslip', title: 'Latest payslip', hint: 'PDF or photo', fills: 'Employer, designation, net salary, income split' },
  { key: 'bankStmt', title: 'Bank statement (6 months)', hint: 'PDF e-statement', fills: 'Bank accounts, monthly expense estimate' },
  { key: 'saleAgreement', title: 'Sale agreement / title deed', hint: 'PDF or photo', fills: 'Price, property & security details, plan/lot no.' },
  { key: 'taxReturn', title: 'Income tax assessment', hint: 'IRD assessment notice', fills: '3-year income tax particulars' },
  { key: 'crib', title: 'CRIB credit report', hint: 'Fetched with your consent', fills: 'Existing & settled loans, leases, credit cards' },
]

const flat = (prefix: string, obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${prefix}.${k}`, v]))

const isEmpty = (row: Record<string, unknown>) => Object.values(row).every(v => v === '' || v === 'Savings' || v === '0')

/** Append rows to a repeater, replacing the untouched placeholder row if present. */
function append(get: Get, list: string, rows: Record<string, unknown>[]) {
  const existing = (get(list) ?? []) as Record<string, unknown>[]
  let start = existing.length
  if (start > 0 && isEmpty(existing[start - 1])) start--
  return Object.fromEntries(rows.map((r, i) => [`${list}.${start + i}`, r]))
}

const A1 = 'Kasun Chaminda Perera'
const A2 = 'Dilini Nadeeka Perera'

/* ---------------- Seylan customer profile (after NIC + OTP) ---------------- */

export function lookupEntries(get: Get) {
  return {
    ...flat('a.0', {
      title: 'Mr', fullName: A1, dob: '1990-05-25', address: 'No. 45/3, Temple Road, Nugegoda',
      phone: '0112 812 345', mobile: '0771 234 567', email: 'kasun.perera@example.com',
      idType: 'NIC', idNo: DEMO_NIC, civil: 'Married', children: '1', dependents: '1',
      slCitizen: 'Yes', dual: 'No', pr: 'No',
    }),
    ...flat('e.0', {
      employer: 'Lanka Tech Solutions (Pvt) Ltd', years: '6', address: 'No. 120, Galle Road, Colombo 03',
      phone: '0112 345 678', nature: 'Information Technology', designation: 'Senior Software Engineer',
      netSalary: '285000', salaryAssigned: 'Yes',
    }),
    'abroad.employed': 'No',
    ...append(get, 'assets.property', [
      { address: 'No. 22, Lake Road, Piliyandala', desc: 'Bare land – 12 perches', owner: A1, value: '6500000', mortgage: 'None' },
      { address: 'Toyota Axio (CAB-4521)', desc: 'Motor car, 2017', owner: A1, value: '5800000', mortgage: 'Leased – Lanka Leasing' },
    ]),
    ...append(get, 'assets.shares', [
      { type: 'Treasury Bills', company: 'Govt. of Sri Lanka (Seylan custody)', value: '500000', assignment: 'None' },
    ]),
    ...append(get, 'assets.policies', [
      { holder: A1, company: 'Island Life Assurance', policyNo: 'LP-2014-88231', face: '3000000', premium: '4,500 / monthly', assignment: 'None' },
    ]),
    ...append(get, 'assets.banks', [
      { bank: 'Seylan Bank – Nugegoda', type: 'Savings', accNo: '0123 4567 89', opened: '2016-03-12', balance: '1245000', holder: A1 },
      { bank: 'Seylan Bank – Nugegoda', type: 'Current', accNo: '0123 9988 21', opened: '2019-07-01', balance: '320000', holder: A1 },
    ]),
    ...append(get, 'liabilities', [
      { creditor: 'Seylan Bank – Personal Loan', borrowed: '1500000', balance: '620000', monthly: '38500', security: 'Salary assignment', period: '2 yrs 4 mths', purpose: 'Personal', holder: '0' },
      { creditor: 'Seylan Bank – Visa Credit Card', borrowed: '300000', balance: '85000', monthly: '8500', security: 'Unsecured', period: 'Revolving', purpose: 'Credit card', holder: '0' },
    ]),
    ...append(get, 'past', [{ bank: 'Seylan Bank', branch: 'Nugegoda', amount: '800000', granted: '2017', settled: '2020' }]),
  }
}

/* ---------------- Spouse – NIC only ---------------- */

export function spouseEntries(get: Get) {
  return {
    joint: 'yes',
    sameAddress: true,
    ...flat('a.1', {
      title: 'Mrs', fullName: A2, dob: '1992-08-14', address: 'No. 45/3, Temple Road, Nugegoda',
      phone: '0112 812 345', mobile: '0719 876 543', email: 'dilini.perera@example.com',
      idType: 'NIC', idNo: DEMO_SPOUSE_NIC, civil: 'Married', children: '1', dependents: '1',
      slCitizen: 'Yes', dual: 'No', pr: 'No',
    }),
    'a.0.civil': 'Married',
    ...flat('e.1', {
      employer: 'Ceylon Medical Supplies (Pvt) Ltd', years: '3', address: 'No. 8, Dr. N.M. Perera Mawatha, Colombo 08',
      phone: '0112 698 321', nature: 'Healthcare distribution', designation: 'Senior Accountant',
      netSalary: '165000', salaryAssigned: 'No', assignmentGiven: 'Yes',
    }),
    ...append(get, 'assets.banks', [
      { bank: 'Seylan Bank – Nugegoda', type: 'Savings', accNo: '0123 7766 54', opened: '2018-10-05', balance: '410000', holder: A2 },
    ]),
  }
}

/* ---------------- Documents ---------------- */

export function docEntries(key: string, get: Get): Record<string, unknown> {
  const joint = get('joint') === 'yes'
  switch (key) {
    case 'nic':
      return flat('a.0', { title: 'Mr', fullName: A1, dob: '1990-05-25', idType: 'NIC', idNo: DEMO_NIC, address: 'No. 45/3, Temple Road, Nugegoda' })
    case 'payslip':
      return {
        ...flat('e.0', {
          employer: 'Lanka Tech Solutions (Pvt) Ltd', address: 'No. 120, Galle Road, Colombo 03', years: '6',
          designation: 'Senior Software Engineer', netSalary: '285000',
        }),
        'inc.basic.0': '215000', 'inc.alw.0': '70000',
      }
    case 'bankStmt':
      return {
        ...append(get, 'assets.banks', [
          { bank: 'Hatton National Bank – Colombo 03', type: 'Savings', accNo: '0881 0045 6732', opened: '2012-01-20', balance: '188000', holder: A1 },
        ]),
        'exp.rent.0': '55000', 'exp.household.0': '60000', 'exp.education.0': '25000', 'exp.personal.0': '20000',
        'exp.travel.0': '15000', 'exp.medical.0': '8000', 'exp.rates.0': '4500', 'exp.utilities.0': '18000',
        'exp.insurance.0': '12000', 'exp.dependents.0': '15000', 'exp.others.0': '10000',
      }
    case 'saleAgreement':
      return {
        'loan.purpose': 'Purchase of a house', 'loan.price': '28500000', 'loan.floorArea': '2100',
        'loan.planApproved': 'Yes', 'loan.coc': 'Yes',
        ...flat('security', {
          location: 'No. 12, Lake Drive, Battaramulla', authority: 'Sri Jayawardenepura Kotte MC', planNo: '2345/2022',
          lotNo: '7', landName: 'Lakeview Gardens', extent: '10.5 perches', owner: 'Saman Kumara Jayasinghe (Vendor)',
          floorArea: '2100', marketValue: '28500000', possession: 'Vacant',
        }),
      }
    case 'taxReturn': {
      const a1 = [
        ['3180000', '3180000', '2980000', '242000', '0'],
        ['3420000', '3420000', '3150000', '330000', '0'],
        ['3600000', '3600000', '3360000', '420000', '0'],
      ]
      const a2 = [
        ['1800000', '1800000', '1600000', '96000', '0'],
        ['1920000', '1920000', '1720000', '114000', '0'],
        ['1980000', '1980000', '1780000', '132000', '0'],
      ]
      const out: Record<string, unknown> = {}
      const keys = ['stat', 'assess', 'taxable', 'paid', 'other']
      a1.forEach((row, y) => row.forEach((v, i) => (out[`tax.${y}.${keys[i]}.0`] = v)))
      if (joint) a2.forEach((row, y) => row.forEach((v, i) => (out[`tax.${y}.${keys[i]}.1`] = v)))
      return out
    }
    case 'crib':
      return {
        liabilities: [
          { creditor: 'Seylan Bank – Personal Loan', borrowed: '1500000', balance: '620000', monthly: '38500', security: 'Salary assignment', period: '2 yrs 4 mths', purpose: 'Personal', holder: '0' },
          { creditor: 'Seylan Bank – Visa Credit Card', borrowed: '300000', balance: '85000', monthly: '8500', security: 'Unsecured', period: 'Revolving', purpose: 'Credit card', holder: '0' },
          { creditor: 'Lanka Leasing PLC – Vehicle lease', borrowed: '3200000', balance: '1850000', monthly: '62000', security: 'Leased vehicle', period: '3 yrs 1 mth', purpose: 'Vehicle / Leasing', holder: '0' },
          ...(joint ? [{ creditor: 'Commercial Bank – Mastercard', borrowed: '200000', balance: '40000', monthly: '6000', security: 'Unsecured', period: 'Revolving', purpose: 'Credit card', holder: '1' }] : []),
        ],
        past: [
          { bank: 'Seylan Bank', branch: 'Nugegoda', amount: '800000', granted: '2017', settled: '2020' },
          { bank: "People's Bank", branch: 'Kandy', amount: '450000', granted: '2014', settled: '2018' },
        ],
      }
    default:
      return {}
  }
}

export const DEMO_LOAN = { 'loan.amount': '15000000', 'loan.rateFixed': '5', 'loan.years': '20', 'security.sellerConsent': true }
