"use client";

import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link } from '@/lib/router-compat'

function NotFound() {
  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <ShieldAlert className="h-12 w-12 text-brand-400" />
      <p className="mt-6 font-mono text-sm text-brand-300">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Page not found</h1>
      <p className="mt-3 text-sm text-slate-400">
        This route is not part of the foundation yet.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  )
}

export default NotFound
