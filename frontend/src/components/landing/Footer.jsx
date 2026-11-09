import { Link } from 'react-router-dom'
import { BrandLogo } from '../common/BrandLogo.jsx'
import { Container } from '../common/Container.jsx'

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Analysis demo', href: '#demo' },
]

const ACCOUNT_LINKS = [
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Use', to: '/terms' },
]

const linkClasses =
  'text-sm text-slate-400 transition-colors duration-200 hover:text-brand-300'

export function Footer() {
  return (
    <footer id="about" className="scroll-mt-24 border-t border-white/5 bg-navy-950/60">
      <Container size="xl" className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <BrandLogo size="md" />
            <p className="type-body mt-4 text-muted">
              A scam-awareness project for the UPI ecosystem, designed to explain
              risky messages, payment requests, and links in plain language.
            </p>
            <p className="type-caption mt-4">
              Detect. Analyze. Protect. &middot; Built to make digital payments
              safer through smarter scam awareness.
            </p>
          </div>

          <nav aria-labelledby="footer-product">
            <h2 id="footer-product" className="type-label">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClasses}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-account">
            <h2 id="footer-account" className="type-label">
              Account
            </h2>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="type-label">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 UPI ScamShield AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p>Detection engine planned for a later phase.</p>
            <Link
              to="/status"
              className="whitespace-nowrap text-brand-300/80 underline-offset-4 transition-colors hover:text-brand-300 hover:underline"
            >
              System status
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
