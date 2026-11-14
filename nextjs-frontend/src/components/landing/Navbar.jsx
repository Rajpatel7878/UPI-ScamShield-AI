"use client";

import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { cn } from '../../utils/cn.js';
import { BrandLogo } from '../common/BrandLogo.jsx';
import { Container } from '../common/Container.jsx';
import { Button, IconButton } from '../ui/index.js';

const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'scanner', label: 'Scam Scanner', href: '/detect' },
  { id: 'url-scanner', label: 'URL Scanner', href: '/detect' },
  { id: 'awareness', label: 'Scam Awareness', href: '#awareness' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => {
      if (link.href.startsWith('#')) {
        return document.getElementById(link.id);
      }
      return null;
    }).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current) setActiveSection(current.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  const linkClasses = (isActive) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
      isActive
        ? 'bg-white/5 text-ink'
        : 'text-slate-400 hover:bg-white/5 hover:text-ink',
    );

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl"
    >
      <Container
        size="xl"
        className="flex h-16 items-center justify-between gap-4"
      >
        <a
          href="#home"
          aria-label="UPI ScamShield AI — back to top"
          className="shrink-0 rounded-lg"
        >
          <BrandLogo size="sm" showTagline={true} asLink={false} />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            const isExternal = link.href.startsWith('/');
            const Tag = isExternal ? Link : 'a';
            return (
              <Tag
                key={link.id}
                to={isExternal ? link.href : undefined}
                href={isExternal ? undefined : link.href}
                aria-current={isActive ? 'location' : undefined}
                className={linkClasses(isActive)}
                onClick={
                  isExternal ? undefined : closeMenu
                }
              >
                {link.label}
              </Tag>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-ink"
          >
            Login
          </Link>
          <Button as={Link} to="/register" size="sm">
            Get Started
          </Button>
        </div>

        <IconButton
          label={isOpen ? 'Close menu' : 'Open menu'}
          variant="ghost"
          className="lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((previous) => !previous)}
        >
          {isOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </IconButton>
      </Container>

      {isOpen && (
        <div
          id="mobile-menu"
          className="border-t border-white/5 bg-navy-950/95 backdrop-blur-xl lg:hidden"
        >
          <Container className="animate-fade-up py-4">
            <nav aria-label="Mobile" className="grid gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                const isExternal = link.href.startsWith('/');
                const Tag = isExternal ? Link : 'a';
                return (
                  <Tag
                    key={link.id}
                    to={isExternal ? link.href : undefined}
                    href={isExternal ? undefined : link.href}
                    onClick={closeMenu}
                    aria-current={isActive ? 'location' : undefined}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 block',
                      isActive
                        ? 'bg-white/5 text-ink'
                        : 'text-slate-300 hover:bg-white/5 hover:text-ink',
                    )}
                  >
                    {link.label}
                  </Tag>
                )
              })}
            </nav>

            <div className="mt-3 grid gap-2 border-t border-white/5 pt-4">
              <Button
                as={Link}
                to="/login"
                variant="secondary"
                fullWidth
                onClick={closeMenu}
              >
                Login
              </Button>
              <Button as={Link} to="/register" fullWidth onClick={closeMenu}>
                Get Started
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
