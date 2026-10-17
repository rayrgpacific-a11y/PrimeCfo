'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import AdminAuth from '@/components/admin/AdminAuth';
import AddClientForm from '@/components/admin/AddClientForm';

export default function AddClientPage() {
  const router = useRouter();

  const handleSuccess = (client: any) => {
    console.log('Client created successfully:', client);
  };

  const handleClose = () => {
    router.push('/admin/dashboard');
  };

  return (
    <AdminAuth>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-200">
        {/* Top Header */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard')}
                className="mr-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Add New Client Account</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-md">
                    CFO Provisioning
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Provision a new client portfolio and optionally link their QuickBooks Online realm
                </p>
              </div>
            </div>
          </div>
        </div>
    
        {/* Form Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <AddClientForm 
              onSuccess={handleSuccess}
              onClose={handleClose}
            />
          </div>
        </div>
      </div>
    </AdminAuth>
  );
}