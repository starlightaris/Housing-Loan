import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'

interface Sms { id: number; to: string; text: string }

/** Fire a simulated SMS. Shows an in-page phone-style notification and, if allowed, a native browser notification too. */
export function sendSms(to: string, text: string) {
  window.dispatchEvent(new CustomEvent<Sms>('demo-sms', { detail: { id: Date.now(), to, text } }))
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Seylan Bank', { body: text })
  } catch { /* native notifications are optional */ }
}

export function askNotificationPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  } catch { /* ignore */ }
}

export function SmsPopup() {
  const [sms, setSms] = useState<Sms | null>(null)

  useEffect(() => {
    const on = (e: Event) => setSms((e as CustomEvent<Sms>).detail)
    window.addEventListener('demo-sms', on)
    return () => window.removeEventListener('demo-sms', on)
  }, [])

  useEffect(() => {
    if (!sms) return
    const t = setTimeout(() => setSms(null), 20000)
    return () => clearTimeout(t)
  }, [sms])

  if (!sms) return null
  return (
    <div key={sms.id} className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[60] animate-[slideIn_0.3s_ease-out]">
      <button type="button" onClick={() => setSms(null)}
        className="w-full text-left bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 p-4 flex gap-3">
        <span className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0"><MessageSquare size={20} /></span>
        <span className="min-w-0">
          <span className="flex items-center justify-between gap-3">
            <span className="font-semibold text-gray-900 text-sm">Messages · SEYLAN</span>
            <span className="text-xs text-gray-400">now</span>
          </span>
          <span className="block text-xs text-gray-500">To {sms.to}</span>
          <span className="block text-sm text-gray-800 mt-1">{sms.text}</span>
        </span>
      </button>
    </div>
  )
}
