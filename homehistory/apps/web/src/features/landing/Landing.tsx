import * as React from 'react';
const Hero = React.lazy(() => import('./components/Hero'));
const PopularProperties = React.lazy(() => import('./components/PopularProperties'));
const ReportShowcase = React.lazy(() => import('./components/ReportShowcase'));
const TwoColPromo = React.lazy(() => import('./components/TwoColPromo'));
const ContractorsRow = React.lazy(() => import('./components/ContractorsRow'));
const DirectoryTable = React.lazy(() => import('./components/DirectoryTable'));
import { FAQ } from './components/FAQ';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Main-footer';

import {
  getContractors,
  getDirectory,
  getFaqs,
  getPopularProperties,
} from './services/landingServices';
import FinanceFuture from './components/FinanceFuture';

export default function Landing() {
  const [properties, setProperties] = React.useState([]);
  const [contractors, setContractors] = React.useState([]);
  const [directoryProfiles, setDirectoryProfiles] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [propertiesData, contractorsData, directoryData, faqsData] = await Promise.all([
          getPopularProperties(),
          getContractors(),
          getDirectory('lenders'),
          getFaqs(),
        ]);

        setProperties(propertiesData);
        setContractors(contractorsData);
        setDirectoryProfiles(directoryData);
        setFaqs(faqsData);
      } catch (error) {
        console.error('Failed to load landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <PopularProperties properties={properties} />
      <ReportShowcase properties={properties} />

      {/* List your home promo */}
      <TwoColPromo
        title={`List your home, land, or 
          commercial space`}
        innerTitle={[
          'Showcase your property to serious buyers in your area and beyond.',
          'Find the Right Agent to Sell Your Property!',
        ]}
        description={[
          `List your property in just a few steps and get it in front of 
          thousands of interested buyers and real estate professionals.
                  
          Our platform is designed to make selling simple, transparent, and 
          effective. Upload photos, set your price, and start receiving inquiries today.`,
          `Our platform connects you with top-rated real estate agents
          who specialize in your area and property type.
                  
          Compare agent profiles, check client reviews, and choose the
          one who best aligns with your selling goals. Whether it's a
          family home, commercial space, or vacant land, we'll help you
          find the expert who gets it sold.`,
        ]}
        primaryButton={['List Your Property', 'Find Agent']}
        imageAlt="Property listing preview"
        onPrimaryClick={() => (window.location.href = '/list')}
      />

      {/* Finance promo */}
      <FinanceFuture
        title={`Finance Your Future, 
          Home, Business, or Beyond`}
        innerTitle={`Get pre-approved quickly with
         homeHistory Loan.`}
        description="Find the right lender and connect with trusted experts who understand your unique financing needs. From residential mortgages to commercial loans, we help you secure the funding that makes your goals possible."
        primaryButton="Find the Right Lender"
        imageAlt="Financial planning consultation"
        onPrimaryClick={() => (window.location.href = '/lenders')}
      />

      <ContractorsRow contractors={contractors} />
      <DirectoryTable profiles={directoryProfiles} />
      <FAQ faqs={faqs} />
      <Footer />
    </div>
  );
}
