import { API_BASE_URL_LANDING } from '@/lib/api';

const fetchOpts: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

export async function getPopularProperties() {
  try {
    const r = await fetch(
      `${API_BASE_URL_LANDING.replace(/\/$/, '')}/properties?limit=6&location=NY`,
      fetchOpts
    );
    if (!r.ok) throw new Error('bad');
    return await r.json();
  } catch {
    return [
      {
        id: 'p1',
        title: 'Villa · For Sale',
        price: 1199000,
        beds: 4,
        baths: 3,
        areaSqft: 2450,
        city: 'NYC',
        image: 'popular-properties-1.jpg',
      },
      {
        id: 'p2',
        title: 'Condo · For Sale',
        price: 543000,
        beds: 2,
        baths: 2,
        areaSqft: 1200,
        city: 'NYC',
        image: 'popular-properties-2.jpg',
      },
      {
        id: 'p3',
        title: 'Coffee shop · For Rent',
        price: 2450,
        beds: 0,
        baths: 1,
        areaSqft: 950,
        city: 'NYC',
        image: 'popular-properties-3.jpg',
      },
    ];
  }
}

export async function getDirectory(kind: 'lenders' | 'agents' | 'contractors') {
  try {
    const r = await fetch(
      `${API_BASE_URL_LANDING.replace(/\/$/, '')}/directory/${kind}`,
      fetchOpts
    );
    if (!r.ok) throw new Error('bad');
    return await r.json();
  } catch {
    return [
      {
        id: '1',
        name: 'Lauren Drew',
        role: 'Lender',
        rating: 4.9,
        projects: 9,
        months: 32,
        clients: 278,
        success: 0.91,
        profile: 'profile.png',
      },
      {
        id: '2',
        name: 'Jasper Nguyen',
        role: 'Agent',
        rating: 4.7,
        projects: 7,
        months: 28,
        clients: 198,
        success: 0.88,
        profile: 'profile.png',
      },
    ];
  }
}

export async function getContractors() {
  try {
    const r = await fetch(
      `${API_BASE_URL_LANDING.replace(/\/$/, '')}/contractors?limit=3`,
      fetchOpts
    );
    if (!r.ok) throw new Error('bad');
    return await r.json();
  } catch {
    return [
      {
        id: 'c1',
        name: 'Sarah Johnson',
        image: 'trusted-contractors-1.jpg',
        rating: 4.9,
        clients: 127,
      },
      { id: 'c2', name: 'Mike Chen', image: 'trusted-contractors-2.jpg', rating: 4.8, clients: 89 },
      {
        id: 'c3',
        name: 'David Rodriguez',
        image: 'trusted-contractors-3.jpg',
        rating: 4.7,
        clients: 156,
      },
    ];
  }
}

export async function getFaqs() {
  try {
    const r = await fetch(`${API_BASE_URL_LANDING.replace(/\/$/, '')}/faqs`, fetchOpts);
    if (!r.ok) throw new Error('bad');
    return await r.json();
  } catch {
    return [
      {
        id: 'faq1',
        q: 'What types of properties can I find on this platform?',
        a: 'You can explore a wide range of listings, including residential homes, apartments, commercial spaces, land, and industrial properties.',
      },
      {
        id: 'faq2',
        q: 'How do reports work?',
        a: 'Enter an address to generate ownership, permits, liens, and comps.',
      },
      {
        id: 'faq3',
        q: 'Can I connect with verified professionals?',
        a: 'Yes, our platform features verified real estate agents, lenders, and contractors with ratings, reviews, and success metrics.',
      },
      {
        id: 'faq4',
        q: 'Is there a fee to use the platform?',
        a: 'Basic property search and browsing is free. Premium features like detailed reports and professional consultations may have associated fees.',
      },
      {
        id: 'faq5',
        q: 'How accurate is the property data?',
        a: 'We aggregate data from multiple authoritative sources including MLS, public records, and verified user submissions to ensure accuracy.',
      },
    ];
  }
}
