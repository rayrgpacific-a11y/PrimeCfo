import { Client, QuickBooksData } from '@/types/admin';

export const DEFAULT_SAMPLE_CLIENTS: Client[] = [
  {
    client_id: 'client-demo-1',
    client_name: 'Acme Holdings LLC',
    company_name: 'Acme Technologies Group',
    email: 'finance@acmeholdings.io',
    phone: '+1 (555) 234-5678',
    is_active: true,
    tags: ['Tech', 'Enterprise', 'Series B', 'QBO Synced'],
    notes: 'Preparing for annual Q4 board presentation. Cash burn remains within budget. Next tax filing review due Nov 20th.',
    client_qbo_connections: [
      {
        company_id: '9130354823485123',
        customer_id: '58',
        sync_enabled: true,
        status: 'connected'
      }
    ]
  },
  {
    client_id: 'client-demo-2',
    client_name: 'Apex Global Logistics',
    company_name: 'Apex Logistics International',
    email: 'cfo@apexlogistics.com',
    phone: '+1 (555) 876-5432',
    is_active: true,
    tags: ['Supply Chain', 'Growth', 'High Priority'],
    notes: 'Working capital revolver utilized at 30%. Invoicing terms renegotiated with top 3 carriers.',
    client_qbo_connections: [
      {
        company_id: '9130354823485124',
        customer_id: '92',
        sync_enabled: true,
        status: 'connected'
      }
    ]
  },
  {
    client_id: 'client-demo-3',
    client_name: 'Vanguard BioHealth',
    company_name: 'Vanguard Healthcare Partners',
    email: 'billing@vanguardbiohealth.org',
    phone: '+1 (555) 345-9876',
    is_active: true,
    tags: ['Healthcare', 'Retainer', 'R&D Tax Credit'],
    notes: 'R&D tax credit study completed. Awaiting Q3 accounts receivable clearance.',
    client_qbo_connections: []
  }
];

export const getSampleQuickBooksData = (client: Client): QuickBooksData => {
  return {
    customer: {
      id: client.client_id,
      name: client.client_name,
      balance: client.client_id === 'client-demo-1' ? 342500 : client.client_id === 'client-demo-2' ? 512000 : 185000,
      email: client.email,
      phone: client.phone,
      active: client.is_active
    },
    invoices: {
      total: client.client_id === 'client-demo-1' ? 12 : 8,
      totalAmount: client.client_id === 'client-demo-1' ? 485000 : 320000,
      overdueAmount: client.client_id === 'client-demo-1' ? 85000 : 35000,
      recentInvoices: [
        { id: '1042', amount: 85000, balance: 85000, dueDate: '2024-11-01', date: '2024-10-01' },
        { id: '1041', amount: 125000, balance: 0, dueDate: '2024-10-15', date: '2024-09-15' },
        { id: '1040', amount: 95000, balance: 45000, dueDate: '2024-11-10', date: '2024-10-10' },
        { id: '1039', amount: 180000, balance: 0, dueDate: '2024-09-30', date: '2024-08-30' }
      ]
    },
    payments: {
      lastPaymentDate: '2024-11-05',
      lastPaymentAmount: 125000
    },
    expenses: {
      total: 18,
      totalAmount: 380000,
      categories: {
        'Payroll & Benefits': 171000,
        'Office & Facilities': 76000,
        'Software & Tools': 57000,
        'Professional Services': 45000,
        'Marketing & Ads': 31000
      }
    },
    profitLoss: {
      revenue: 520000,
      expenses: 380000,
      netIncome: 140000
    },
    status: client.client_qbo_connections?.[0] ? 'connected' : 'not_connected'
  };
};
