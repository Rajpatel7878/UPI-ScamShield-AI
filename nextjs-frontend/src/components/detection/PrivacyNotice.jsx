"use client";

import { ShieldCheck } from 'lucide-react'
import { cn } from '../../utils/cn.js'

export function PrivacyNotice() {
  return (
    <div
      className={cn(
        'rounded-lg border border-brand-500/40 bg-brand-500/5 p-5 mb-6',
        'animate-fade-in',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-5 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
          <ShieldCheck className="size-3" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="type-h3 font-medium text-brand-300">Protect Your Financial Information</h3>
          <p className="type-body-sm text-slate-300 line-clamp-4">
            <strong>Never enter your UPI PIN.</strong> No legitimate bank, payment
            app, or support agent will ever ask for your UPI PIN to keep your
            account safe.
          </p>
          <p className="type-body-sm text-slate-300 line-clamp-4 mt-2">
            <strong>Never share your OTP.</strong> One-time passwords are
            personal and should never be disclosed to anyone, including so-called
            support agents.
          </p>
          <p className="type-body-sm text-slate-300 line-clamp-4 mt-2">
            <strong>Never submit banking passwords.</strong> Your banking password
            is for your eyes only. Do not enter it anywhere outside your bank&apos;s
            official website or app.
          </p>
          <p className="type-body-sm text-slate-300 line-clamp-4 mt-2">
            <strong>Never approve unknown collect requests.</strong> Unexpected
            payment collection requests should be verified through your bank&apos;s
            official channels before approving.
          </p>
          <p className="type-body-sm text-slate-300 line-clamp-4 mt-2">
            <strong>Verify using official channels.</strong> Always navigate to
            your bank&apos;s official app or website directly rather than clicking
            links or responding to unsolicited messages.
          </p>
        </div>
      </div>
    </div>
  )
}