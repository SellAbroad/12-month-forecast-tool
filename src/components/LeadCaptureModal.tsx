import { useState, useEffect, useRef } from 'react'

interface LeadCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; email: string; phone: string; company: string }) => void
  isSubmitting: boolean
  error: string | null
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: LeadCaptureModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) nameRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email'
    if (!phone.trim()) errors.phone = 'Phone is required'
    if (!company.trim()) errors.company = 'Company is required'
    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim() })
  }

  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          Get your forecast report
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Enter your details to download the PDF report.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Name *</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={isSubmitting}
              className={inputClass}
            />
            {localErrors.name && <span className="text-xs text-red-600">{localErrors.name}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              disabled={isSubmitting}
              className={inputClass}
            />
            {localErrors.email && <span className="text-xs text-red-600">{localErrors.email}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">Phone *</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
              className={inputClass}
            />
            {localErrors.phone && <span className="text-xs text-red-600">{localErrors.phone}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">Company *</span>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              disabled={isSubmitting}
              className={inputClass}
            />
            {localErrors.company && <span className="text-xs text-red-600">{localErrors.company}</span>}
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
