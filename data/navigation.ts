export interface NavItem {
  label: string;
  href: string;
  anchorId?: string;
  isAnchor: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: {
    label: string;
    href: string;
    external?: boolean;
  }[];
}

export const mainNavItems: NavItem[] = [
  { label: 'Features', href: '/#features', anchorId: 'features', isAnchor: true },
  { label: 'How It Works', href: '/#how-it-works', anchorId: 'how-it-works', isAnchor: true },
  { label: 'Pricing', href: '/pricing', isAnchor: false },
  { label: 'About Us', href: '/about', isAnchor: false },
  { label: 'Security', href: '/security', isAnchor: false },
  { label: 'Contact', href: '/contact', isAnchor: false },
];

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'QuickBooks Sync', href: '/connect' }
    ]
  },
  {
    title: 'Platform',
    links: [
      { label: 'Client Dashboard', href: '/dashboard' },
      { label: 'Financial Insights', href: '/insights' },
      { label: 'Executive Reports', href: '/reports' },
      { label: 'QuickBooks Connect', href: '/connect' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Security', href: '/security' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/eula' },
      { label: 'Privacy Policy', href: '/privacy' }
    ]
  }
];
