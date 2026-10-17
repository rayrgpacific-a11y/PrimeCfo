'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  AlertCircle, 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  Tag,
  FileText,
  Link,
  ChevronRight,
  Loader2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface ClientFormData {
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  client_type: string;
  tags: string[];
  notes: string;
  is_active: boolean;
  qbo_customer_id?: string;
}

interface AddClientFormProps {
  onClose?: () => void;
  onSuccess?: (client: any) => void;
}

export default function AddClientForm({ onClose, onSuccess }: AddClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    client_name: '',
    company_name: '',
    email: '',
    phone: '',
    client_type: '',
    tags: [],
    notes: '',
    is_active: true,
    qbo_customer_id: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [qboConnecting, setQboConnecting] = useState(false);
  const [qboConnected, setQboConnected] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Client type options
  const clientTypes = [
    'Small Business',
    'Enterprise',
    'Startup',
    'Non-Profit',
    'Individual',
    'Agency',
    'E-commerce',
    'SaaS',
    'Retail',
    'Manufacturing',
    'Healthcare',
    'Real Estate',
    'Other'
  ];

  // Common tags
  const suggestedTags = [
    'VIP',
    'High Priority',
    'New',
    'Monthly Retainer',
    'Project-Based',
    'Hourly',
    'Remote',
    'Local',
    'International'
  ];

  useEffect(() => {
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'true') {
      setQboConnected(true);
      setQboConnecting(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'connection_failed') {
      setError('Failed to connect to QuickBooks. Please try again.');
      setQboConnecting(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.client_name.trim()) {
      setError('Client name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data to send, explicitly including qbo_customer_id
      const clientData = {
        client_name: formData.client_name,
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        client_type: formData.client_type,
        tags: formData.tags,
        notes: formData.notes,
        is_active: formData.is_active,
        qbo_customer_id: formData.qbo_customer_id || null // Explicitly include, send null if empty
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }
      
      setSuccess(true);
      setNewClientId(result.data.client_id);
      setShowSuccessScreen(true);
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    } finally {
      if (!error) {
        setIsSubmitting(false);
      }
    }
  };

  const handleConnectQuickBooks = () => {
    if (!newClientId) return;
    
    setQboConnecting(true);
    // Open OAuth flow in same window
    window.location.href = `/api/quickbooks/auth?clientId=${newClientId}`;
  };

  const handleFinish = () => {
    if (onClose) {
      onClose();
    } else {
      // Reset form for another entry
      setFormData({
        client_name: '',
        company_name: '',
        email: '',
        phone: '',
        client_type: '',
        tags: [],
        notes: '',
        is_active: true,
        qbo_customer_id: ''
      });
      setSuccess(false);
      setNewClientId(null);
      setQboConnected(false);
      setShowSuccessScreen(false);
      setError(null);
    }
  };

  // Success screen after client creation
  if (showSuccessScreen) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Client Account Created!</h2>
          <p className="text-slate-400 text-sm">Now let's connect their QuickBooks Online realm</p>
        </div>

        <div className="space-y-4">
          {/* Client Summary */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3 text-sm">Client Account Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Name</dt>
                <dd className="font-medium text-slate-200">{formData.client_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Email</dt>
                <dd className="font-medium text-slate-200">{formData.email}</dd>
              </div>
              {formData.company_name && (
                <div>
                  <dt className="text-slate-500 text-xs">Company</dt>
                  <dd className="font-medium text-slate-200">{formData.company_name}</dd>
                </div>
              )}
              {formData.client_type && (
                <div>
                  <dt className="text-slate-500 text-xs">Type</dt>
                  <dd className="font-medium text-slate-200">{formData.client_type}</dd>
                </div>
              )}
              {formData.phone && (
                <div>
                  <dt className="text-slate-500 text-xs">Phone</dt>
                  <dd className="font-medium text-slate-200">{formData.phone}</dd>
                </div>
              )}
              {formData.qbo_customer_id && (
                <div>
                  <dt className="text-slate-500 text-xs">QuickBooks ID</dt>
                  <dd className="font-medium text-teal-400">{formData.qbo_customer_id}</dd>
                </div>
              )}
              {formData.tags.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-slate-500 text-xs mb-1">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {formData.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* QuickBooks Connection */}
          <div className={`border rounded-xl p-6 transition-all ${
            qboConnected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    qboConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {qboConnecting ? (
                      <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    ) : qboConnected ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Link className="w-5 h-5 text-teal-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      QuickBooks Integration
                    </h3>
                    <p className="text-xs text-slate-400">
                      {qboConnected 
                        ? 'Successfully connected & synchronized!' 
                        : qboConnecting 
                          ? 'Authorizing with Intuit OAuth...' 
                          : formData.qbo_customer_id 
                            ? 'Customer ID provided - ready for automated sync'
                            : 'Connect to sync general ledger & invoices automatically'}
                    </p>
                  </div>
                </div>
                
                {!qboConnected && !qboConnecting && !formData.qbo_customer_id && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-slate-400">
                      <p className="mb-2 text-slate-300 font-medium">Automatic multi-client synchronization enables:</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>Sync invoices and payments automatically</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>Track customer accounts receivable in real-time</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>Generate real-time executive P&L and Balance Sheet reports</span>
                        </li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={handleConnectQuickBooks}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <img 
                        src="https://cdn.brandfolder.io/I0O6R8JF/at/c3vm4xbbxcb9f5vqstfnv4/qb-logo-white.svg" 
                        alt="QuickBooks" 
                        className="h-4"
                      />
                      <span>Connect QuickBooks Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {formData.qbo_customer_id && !qboConnected && (
                  <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <p className="text-xs text-teal-300 font-medium">
                      ✓ QuickBooks Customer ID provided ({formData.qbo_customer_id}). Financial reports will sync using this customer ledger ID.
                    </p>
                  </div>
                )}
                
                {qboConnected && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-300 font-medium">
                      ✓ QuickBooks account connected successfully. Financial statements are now live in the operator portal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!qboConnected && !formData.qbo_customer_id && (
              <button
                onClick={handleFinish}
                className="flex-1 px-4 py-2.5 border border-slate-700 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-750 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
              >
                Skip for Now
              </button>
            )}
            <button
              onClick={handleFinish}
              className={`flex-1 px-4 py-2.5 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                qboConnected || formData.qbo_customer_id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-500/20' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {qboConnected || formData.qbo_customer_id ? (
                <>
                  <span>Finish Setup & Open Portfolio</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Another Client</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Main form
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <span>Provision New Client Entity</span>
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Form"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client Contact / Owner Name *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                placeholder="e.g., Sarah Jenkins"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
                required
              />
            </div>
            
            <div>
              <label htmlFor="company_name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Entity Name
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="e.g., Apex Logistics LLC"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Billing Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="client@apexlogistics.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 234-5678"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_type" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client Classification
              </label>
              <select
                id="client_type"
                name="client_type"
                value={formData.client_type}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select entity classification...</option>
                {clientTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                ))}
              </select>
            </div>

            {/* QuickBooks Customer ID */}
            <div>
              <label htmlFor="qbo_customer_id" className="block text-xs font-semibold text-slate-300 mb-1.5">
                QuickBooks Customer / Ledger ID (Optional)
              </label>
              <input
                type="text"
                id="qbo_customer_id"
                name="qbo_customer_id"
                value={formData.qbo_customer_id || ''}
                onChange={handleInputChange}
                placeholder="e.g., 58 (Intuit Customer ID)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank to connect via OAuth later. If you know their Intuit customer record number, enter it here.
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">Tags &amp; Industry Segments</h3>
          
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add custom tag (e.g. Series A, Retainer)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-700 text-teal-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Add Tag
              </button>
            </div>
            
            {/* Current Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-teal-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Suggested Tags */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddSuggestedTag(tag)}
                    disabled={formData.tags.includes(tag)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      formData.tags.includes(tag)
                        ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <Plus className="inline w-2.5 h-2.5 mr-1 text-teal-400" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="pt-4 border-t border-slate-800">
          <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
            Advisory &amp; Onboarding Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="CFO engagement notes, accounting basis preferences, initial goals..."
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-medium resize-none"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2.5 pt-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="w-4 h-4 accent-teal-500 bg-slate-800 border-slate-700 rounded cursor-pointer"
          />
          <label htmlFor="is_active" className="text-xs font-medium text-slate-300 cursor-pointer">
            Entity is Active for Monthly CFO Oversight
          </label>
        </div>

        {/* QuickBooks Notice */}
        <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Link className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs mb-0.5">QuickBooks Online Integration</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {formData.qbo_customer_id 
                  ? `Intuit Customer ID ${formData.qbo_customer_id} will be linked automatically upon saving.`
                  : 'Immediately after saving, you will have the option to connect this client account to Intuit QuickBooks Online OAuth.'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !isSubmitting && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-800">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-700 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-750 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Provisioning Client Entity...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Client Entity</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}