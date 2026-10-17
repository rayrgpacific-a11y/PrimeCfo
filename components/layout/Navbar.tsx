'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Menu, X, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { mainNavItems } from '@/data/navigation';

interface UserSession {
  email: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isOperator, setIsOperator] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHomePage = pathname === '/' || pathname === '';

  // Check auth session on mount and route changes
  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          setUser(null);
          setIsOperator(false);
          return;
        }
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          setIsOperator(!!data.isOperator);
        } else {
          setUser(null);
          setIsOperator(false);
        }
      })
      .catch(() => {
        setUser(null);
        setIsOperator(false);
      });
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setIsOperator(false);
      setUserDropdownOpen(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchorId?: string) => {
    if (!anchorId) return;
    if (isHomePage) {
      e.preventDefault();
      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${anchorId}`);
      }
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    }
  };

  const getInitials = (email: string) => {
    if (!email) return '?';
    const namePart = email.split('@')[0]?.trim() ?? '';
    if (!namePart) return '?';
    const parts = namePart.split(/[._-]+/).filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : namePart.slice(0, 2).toUpperCase();
  };

  // Navigation items when logged in - distinct for Operator vs Client User
  const loggedInNavItems = isOperator
    ? [
        { label: 'CFO Command Center', href: '/admin/dashboard' },
        { label: 'Clients', href: '/admin/clients/add' },
        { label: 'Client View', href: '/dashboard' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports', href: '/reports' },
        { label: 'Insights', href: '/insights' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Prime<span className="text-teal-400">CFO</span>
              <span className="text-slate-400 text-sm">.ai</span>
            </span>
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              // Logged in user navigation
              loggedInNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                      isActive
                        ? 'text-teal-400 bg-slate-800'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })
            ) : (
              // Public navigation
              mainNavItems.map((item) => {
                const isActive = !item.isAnchor && pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(e) => item.isAnchor ? handleAnchorClick(e, item.anchorId) : undefined}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                      isActive
                        ? 'text-teal-400 bg-slate-800'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              // User Avatar & Dropdown Menu
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md">
                    {getInitials(user.email)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-800/80">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      {isOperator && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          <Shield className="w-2.5 h-2.5" /> Operator
                        </span>
                      )}
                    </div>

                    {isOperator ? (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-teal-400" />
                          CFO Command Center
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-teal-400" />
                          Client Portal View
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        My Client Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Logged Out Header CTAs
              <>
                <Link 
                  href="/login?next=/dashboard" 
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/connect"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/98 px-4 pt-3 pb-6 space-y-1.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          {user ? (
            // Logged in mobile links
            loggedInNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
              >
                {item.label}
              </Link>
            ))
          ) : (
            // Public mobile links
            mainNavItems.map((item) => {
              const isActive = !item.isAnchor && pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (item.isAnchor) handleAnchorClick(e, item.anchorId);
                    else setMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-teal-400 bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })
          )}
          
          <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-col gap-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full text-center py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Sign Out ({user.email})
              </button>
            ) : (
              <Link
                href="/login?next=/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
