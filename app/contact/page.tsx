'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Calendar,
  Clock,
  HelpCircle,
  Send,
  CheckCircle2,
  Building,
  Phone
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'quickbooks',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-slate-950 to-slate-950 -z-10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            We&apos;re here to help
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Questions about QuickBooks, billing, or your account? Reach our team by email or schedule a call.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left: Contact Channels & Topics */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Ways to connect</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Email Support */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                      <Mail className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Email support</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Best for account issues, QuickBooks connection problems, and billing questions. We typically respond within one business day.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>Mon–Fri, 9am–5pm PT</span>
                    </div>
                    <a
                      href="mailto:support@primecfo.ai"
                      className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      support@primecfo.ai &rarr;
                    </a>
                  </div>

                  {/* Book Conversation */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Book a conversation</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Prefer to talk through your setup or explore the ACT plan? Schedule a 15-minute call with our advisory team.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      <span>15-min discovery</span>
                    </div>
                    <a
                      href="mailto:andrew@primeaccsolutions.com?subject=PrimeCFO%20Consultation"
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Schedule a call &rarr;
                    </a>
                  </div>

                </div>
              </div>

              {/* Common Topics */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Common topics</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">QuickBooks connection</p>
                      <p className="text-xs text-slate-400">OAuth errors, sync issues, or reconnecting your company.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">Billing &amp; subscriptions</p>
                      <p className="text-xs text-slate-400">Plans, invoices, trials, and payment questions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">Account &amp; login</p>
                      <p className="text-xs text-slate-400">Sign up, password reset, and access to your dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Message Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Send us a message</h2>
              <p className="text-sm text-slate-400 mb-6">
                Fill out the form below and an advisor from our team will get back to you promptly.
              </p>

              {submitted ? (
                <div className="p-6 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                  <h3 className="text-lg font-semibold text-white">Message Received!</h3>
                  <p className="text-sm text-slate-300">
                    Thank you for reaching out. We will respond within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: 'quickbooks', message: '' }); }}
                    className="text-xs text-teal-400 underline underline-offset-4 pt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      <option value="quickbooks">QuickBooks Connection &amp; Sync</option>
                      <option value="billing">Pricing &amp; Subscriptions</option>
                      <option value="advisory">Advisory &amp; ACT Plan Inquiry</option>
                      <option value="other">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help your business?"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-medium text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
