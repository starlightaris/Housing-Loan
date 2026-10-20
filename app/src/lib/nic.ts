// Sri Lankan NIC helper. Old format: 9 digits + V/X (YYDDDNNNC). New format: 12 digits (YYYYDDDNNNNC).
// Day-of-year is always counted as if the year were a leap year; females have 500 added.

const MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export interface NicInfo {
  valid: boolean
  dob?: string // yyyy-mm-dd
  gender?: 'Male' | 'Female'
}

export function parseNic(raw: string): NicInfo {
  const nic = raw.trim().toUpperCase()
  let year: number
  let days: number
  if (/^\d{9}[VX]$/.test(nic)) {
    year = 1900 + parseInt(nic.slice(0, 2), 10)
    days = parseInt(nic.slice(2, 5), 10)
  } else if (/^\d{12}$/.test(nic)) {
    year = parseInt(nic.slice(0, 4), 10)
    days = parseInt(nic.slice(4, 7), 10)
  } else {
    return { valid: false }
  }
  const gender = days > 500 ? 'Female' : 'Male'
  if (days > 500) days -= 500
  if (days < 1 || days > 366) return { valid: false }
  let month = 0
  while (month < 12 && days > MONTHS[month]) {
    days -= MONTHS[month]
    month++
  }
  if (month > 11) return { valid: false }
  const pad = (n: number) => String(n).padStart(2, '0')
  return { valid: true, dob: `${year}-${pad(month + 1)}-${pad(days)}`, gender }
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}
