import { createContext, useContext, type ReactNode } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { fmt, num } from '../lib/finance'

/* ---------------- error context ---------------- */

export const ErrCtx = createContext<Record<string, string>>({})
export const useErr = (path: string) => useContext(ErrCtx)[path]

/* ---------------- layout ---------------- */

export function Card({ icon, title, subtitle, section, children, action }: {
  icon?: ReactNode; title: string; subtitle?: string; section?: string; children: ReactNode; action?: ReactNode
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-5 md:p-8 mb-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            {icon && <span className="text-[#E11D25]">{icon}</span>}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            {section && <span className="text-[11px] font-semibold tracking-wide uppercase bg-gray-100 text-gray-500 rounded px-2 py-0.5">{section}</span>}
          </div>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function SubHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4 mt-2">
      <h3 className="font-semibold text-gray-800">{children}</h3>
      {right}
    </div>
  )
}

export function Grid({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: ReactNode }) {
  const c = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' }[cols]
  return <div className={`grid ${c} gap-x-5`}>{children}</div>
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  const t = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }[tone]
  return <div className={`border rounded-lg px-4 py-3 text-sm mb-5 ${t}`}>{children}</div>
}

export function Btn({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'outline' | 'soft'; disabled?: boolean; className?: string; type?: 'button' | 'submit'
}) {
  const v = {
    primary: 'bg-[#E11D25] text-white hover:bg-[#801D25]',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    outline: 'border border-[#E11D25] text-[#E11D25] hover:bg-red-50',
    soft: 'bg-red-50 text-[#E11D25] hover:bg-red-100',
  }[variant]
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${v} ${className}`}>
      {children}
    </button>
  )
}

/* ---------------- field chrome ---------------- */

export function SourceBadge({ source }: { source?: string }) {
  if (!source) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 whitespace-nowrap">
      <Zap size={10} /> {source}
    </span>
  )
}

export function FieldShell({ label, required, error, source, hint, children, className = '' }: {
  label?: string; required?: boolean; error?: string; source?: string; hint?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <div className="mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}

const inputCls = (err: boolean, auto: boolean, ro?: boolean) =>
  `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#E11D25] focus:border-transparent outline-none transition-colors ` +
  (err ? 'border-red-400 bg-red-50 ' : auto ? 'border-emerald-300 bg-emerald-50/60 ' : 'border-gray-300 bg-white ') +
  (ro ? 'bg-gray-50 text-gray-600 ' : '')

/* ---------------- connected inputs ---------------- */

interface BaseProps {
  path: string
  label?: string
  required?: boolean
  hint?: ReactNode
  className?: string
  compact?: boolean // no label/margins – used inside tables
}

export function Text({ path, label, required, hint, className, compact, placeholder, type = 'text', list, readOnly, inputMode, maxLength }: BaseProps & {
  placeholder?: string; type?: string; list?: string; readOnly?: boolean; inputMode?: 'numeric' | 'tel' | 'email' | 'text'; maxLength?: number
}) {
  const s = useStore()
  const err = useErr(path)
  const src = s.src[path]
  const input = (
    <input type={type} value={s.get(path) ?? ''} list={list} readOnly={readOnly} inputMode={inputMode} maxLength={maxLength}
      onChange={e => s.set(path, e.target.value)} placeholder={placeholder}
      className={inputCls(!!err, !!src, readOnly) + (compact ? ' !py-2 text-sm' : '')} />
  )
  if (compact) return <div className={className}>{input}{err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}</div>
  return <FieldShell label={label} required={required} error={err} source={src} hint={hint} className={className}>{input}</FieldShell>
}

export function Area({ path, label, required, hint, className, placeholder, rows = 2 }: BaseProps & { placeholder?: string; rows?: number }) {
  const s = useStore()
  const err = useErr(path)
  const src = s.src[path]
  return (
    <FieldShell label={label} required={required} error={err} source={src} hint={hint} className={className}>
      <textarea rows={rows} value={s.get(path) ?? ''} onChange={e => s.set(path, e.target.value)} placeholder={placeholder}
        className={inputCls(!!err, !!src)} />
    </FieldShell>
  )
}

export function Money({ path, label, required, hint, className, compact, placeholder = '0' }: BaseProps & { placeholder?: string }) {
  const s = useStore()
  const err = useErr(path)
  const src = s.src[path]
  const raw = s.get(path) ?? ''
  const shown = raw === '' ? '' : fmt(num(raw))
  const input = (
    <div className="relative">
      {!compact && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">Rs.</span>}
      <input inputMode="numeric" value={shown} placeholder={placeholder}
        onChange={e => s.set(path, e.target.value.replace(/[^\d]/g, ''))}
        className={inputCls(!!err, !!src) + (compact ? ' !py-2 !px-2 text-sm text-right' : ' pl-12 text-right')} />
    </div>
  )
  if (compact) return <div className={className}>{input}</div>
  return <FieldShell label={label} required={required} error={err} source={src} hint={hint} className={className}>{input}</FieldShell>
}

export function Select({ path, label, required, hint, className, compact, options, placeholder = 'Select', allowOther }: BaseProps & {
  options: (string | { value: string; label: string })[]; placeholder?: string; allowOther?: boolean
}) {
  const s = useStore()
  const err = useErr(path)
  const src = s.src[path]
  const value = s.get(path) ?? ''
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  if (allowOther && value && !opts.some(o => o.value === value)) opts.push({ value, label: value })
  const el = (
    <select value={value} onChange={e => s.set(path, e.target.value)}
      className={inputCls(!!err, !!src) + (compact ? ' !py-2 text-sm' : '')}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
  if (compact) return <div className={className}>{el}</div>
  return <FieldShell label={label} required={required} error={err} source={src} hint={hint} className={className}>{el}</FieldShell>
}

export function Choice({ path, label, required, hint, className, options, onChange }: BaseProps & {
  options: (string | { value: string; label: string })[]; onChange?: (v: string) => void
}) {
  const s = useStore()
  const err = useErr(path)
  const src = s.src[path]
  const value = s.get(path) ?? ''
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <FieldShell label={label} required={required} error={err} source={src} hint={hint} className={className}>
      <div className={`flex flex-wrap gap-2 ${err ? 'ring-1 ring-red-300 rounded-lg p-1' : ''}`}>
        {opts.map(o => {
          const on = value === o.value
          return (
            <button key={o.value} type="button"
              onClick={() => { s.set(path, on ? '' : o.value); if (!on) onChange?.(o.value) }}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${on
                ? src ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold' : 'border-[#E11D25] bg-red-50 text-[#E11D25] font-semibold'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}>
              {o.label}
            </button>
          )
        })}
      </div>
    </FieldShell>
  )
}

export const YesNo = (p: BaseProps & { onChange?: (v: string) => void }) => <Choice {...p} options={['Yes', 'No']} />

export function Check({ path, label, className = '', children }: { path: string; label?: ReactNode; className?: string; children?: ReactNode }) {
  const s = useStore()
  const err = useErr(path)
  const on = !!s.get(path)
  return (
    <div className={`mb-5 ${className}`}>
      <label className={`flex items-start gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-colors ${err ? 'border-red-400 bg-red-50' : on ? 'border-[#E11D25]/40 bg-red-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
        <input type="checkbox" checked={on} onChange={e => s.set(path, e.target.checked)} className="mt-1 h-4 w-4 accent-[#E11D25]" />
        <span className="text-sm text-gray-700">{label}{children}</span>
      </label>
      {err && <p className="text-xs text-red-600 mt-1.5">{err}</p>}
    </div>
  )
}

/* ---------------- repeater (table-style sections) ---------------- */

export function Repeater({ listPath, noneKey, noneLabel, newRow, addLabel, rowTitle, children, fillAction }: {
  listPath: string; noneKey: string; noneLabel: string; newRow: () => unknown; addLabel: string; rowTitle: string
  children: (prefix: string, idx: number) => ReactNode
  fillAction?: ReactNode
}) {
  const s = useStore()
  const rows = (s.get(listPath) ?? []) as Record<string, unknown>[]
  const none = !!s.get(noneKey)
  return (
    <div>
      {fillAction}
      <Check path={noneKey} label={noneLabel} className="!mb-4" />
      {!none && (
        <>
          {rows.map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{rowTitle} {i + 1}</span>
                {rows.length > 1 && (
                  <button type="button" onClick={() => s.removeRow(listPath, i)} className="text-gray-400 hover:text-red-600 p-1" aria-label="Remove row">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {children(`${listPath}.${i}`, i)}
            </div>
          ))}
          <Btn variant="soft" onClick={() => s.addRow(listPath, newRow())}><Plus size={16} /> {addLabel}</Btn>
        </>
      )}
    </div>
  )
}
