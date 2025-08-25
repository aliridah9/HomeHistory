import * as React from 'react'
import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { PopularProperties } from '../components/landing/PopularProperties'
import { ReportShowcase } from '../components/landing/ReportShowcase'
import { TwoColPromo } from '../components/landing/TwoColPromo'
import { ContractorsRow } from '../components/landing/ContractorsRow'
import { DirectoryTable } from '../components/landing/DirectoryTable'
import { FAQ } from '../components/landing/FAQ'
import { Footer } from '../components/landing/Footer'
import { getPopularProperties, getContractors, getDirectory, getFaqs } from '../lib/api'

export default function LandingPage() {
  const [properties, setProperties] = React.useState([])
  const [contractors, setContractors] = React.useState([])
  const [directoryProfiles, setDirectoryProfiles] = React.useState([])
  const [faqs, setFaqs] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [propertiesData, contractorsData, directoryData, faqsData] = await Promise.all([
          getPopularProperties(),
          getContractors(),
          getDirectory('lenders'),
          getFaqs()
        ])
        
        setProperties(propertiesData)
        setContractors(contractorsData)
        setDirectoryProfiles(directoryData)
        setFaqs(faqsData)
      } catch (error) {
        console.error('Failed to load landing page data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <PopularProperties properties={properties} />
      <ReportShowcase />
      
      {/* List your home promo */}
      <TwoColPromo
        title="List your home, land, or commercial space"
        description="Whether you're selling a family home, vacant land, or commercial property, our platform connects you with serious buyers and provides comprehensive market insights to help you get the best price."
        primaryButton="List Your Property"
        secondaryButton="Learn more"
        imageName="report-img.jpg"
        imageAlt="Property listing preview"
        onPrimaryClick={() => window.location.href = '/list'}
        onSecondaryClick={() => window.location.href = '/learn-more'}
      />

      {/* Finance promo */}
      <TwoColPromo
        overline="Finance & Lenders"
        title="Finance Your Future, Home, Business, or Beyond"
        description="Find the right lender and connect with trusted experts who understand your unique financing needs. From residential mortgages to commercial loans, we help you secure the funding that makes your goals possible."
        primaryButton="Find the Right Lender"
        secondaryButton="Get Pre-Approved"
        imageName="finance-your-future.jpg"
        imageAlt="Financial planning consultation"
        reverse={true}
        onPrimaryClick={() => window.location.href = '/lenders'}
        onSecondaryClick={() => window.location.href = '/pre-approval'}
      />

      <ContractorsRow contractors={contractors} />
      <DirectoryTable profiles={directoryProfiles} />
      <FAQ faqs={faqs} />
      <Footer />
    </div>
  )
}