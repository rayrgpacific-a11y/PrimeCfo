export interface TestimonialReview {
  id: string;
  quote: string;
  author: string;
  location: string;
  source: string;
  rating: number;
}

export interface PartnerIntegration {
  name: string;
  color: string;
  tagline: string;
}

export const yelpReviews: TestimonialReview[] = [
  {
    id: 'review-1',
    quote: "I cannot say enough good things about Andrew and his team. He's always responsive and easy to deal with. Do yourself a favor — hand off this task to Prime Accounting.",
    author: 'Michael B.',
    location: 'Los Angeles, CA',
    source: 'via Yelp',
    rating: 5
  },
  {
    id: 'review-2',
    quote: "Andrew and his team were so professional and welcoming. I needed help getting a better handle on my monthly expenses — if you're looking for someone who can get you on track and put you at ease, call them ASAP.",
    author: 'Paul J.',
    location: 'Santa Monica, CA',
    source: 'via Yelp',
    rating: 5
  },
  {
    id: 'review-3',
    quote: "7 years and counting. 30 years in business — believe me, I know what it's like to be frustrated with bookkeeping and taxes. He knows accounting better than anyone we've ever used. An absolute professional.",
    author: 'Richard R.',
    location: 'Los Angeles, CA',
    source: 'via Yelp',
    rating: 5
  }
];

export const trustedPartners: PartnerIntegration[] = [
  { name: 'QuickBooks', color: '#2CA01C', tagline: 'Official Integration' },
  { name: 'Stripe', color: '#635BFF', tagline: 'Secure Payments' },
  { name: 'Plaid', color: '#94A3B8', tagline: 'Bank Connections' },
  { name: 'Supabase', color: '#10B981', tagline: 'Encrypted Storage' }
];
