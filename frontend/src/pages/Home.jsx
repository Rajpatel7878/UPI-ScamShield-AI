import ApiStatusCard from '../components/ApiStatusCard.jsx'
import logoUrl from '../assets/logo.svg'
import { useApp } from '../context/AppContext.jsx'
import { APP_VERSION } from '../utils/constants.js'

function Home() {
  const { appName, tagline, description } = useApp()

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium tracking-wide text-brand-300">
        Internal &middot; Project status
      </span>

      <img
        src={logoUrl}
        alt=""
        className="mt-8 h-20 w-20 drop-shadow-[0_0_28px_rgba(45,212,191,0.35)]"
      />

      <h1 className="mt-6 bg-linear-to-r from-white via-brand-200 to-success-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
        {appName}
      </h1>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.32em] text-brand-300">
        {tagline}
      </p>

      <p className="mt-5 max-w-md text-base text-slate-400">{description}</p>

      <div className="mt-9 w-full">
        <ApiStatusCard />
      </div>

      <p className="mt-6 font-mono text-xs text-slate-600">
        Frontend v{APP_VERSION} &middot; React + Vite + Tailwind CSS
      </p>
    </div>
  )
}

export default Home
