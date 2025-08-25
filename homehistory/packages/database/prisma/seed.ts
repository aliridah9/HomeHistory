import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create data sources
  const dataSources = await Promise.all([
    prisma.dataSource.upsert({
      where: { name: 'zillow' },
      update: {},
      create: {
        name: 'zillow',
        apiUrl: 'https://api.zillow.com/v2',
        isActive: true,
        syncInterval: 24, // Daily sync
        config: {
          rateLimit: 1000,
          retryAttempts: 3,
        },
      },
    }),
    prisma.dataSource.upsert({
      where: { name: 'google_maps' },
      update: {},
      create: {
        name: 'google_maps',
        apiUrl: 'https://maps.googleapis.com/maps/api',
        isActive: true,
        syncInterval: 168, // Weekly sync
        config: {
          services: ['geocoding', 'places', 'streetview'],
        },
      },
    }),
    prisma.dataSource.upsert({
      where: { name: 'county_records' },
      update: {},
      create: {
        name: 'county_records',
        apiUrl: 'https://api.countyrecords.com/v1',
        isActive: true,
        syncInterval: 168, // Weekly sync
        config: {
          dataTypes: ['permits', 'assessments', 'ownership'],
        },
      },
    }),
    prisma.dataSource.upsert({
      where: { name: 'tax_assessor' },
      update: {},
      create: {
        name: 'tax_assessor',
        apiUrl: 'https://api.taxassessor.com/v1',
        isActive: true,
        syncInterval: 720, // Monthly sync
        config: {
          dataTypes: ['assessments', 'taxHistory'],
        },
      },
    }),
    prisma.dataSource.upsert({
      where: { name: 'permit_data' },
      update: {},
      create: {
        name: 'permit_data',
        apiUrl: 'https://api.permitdata.com/v1',
        isActive: true,
        syncInterval: 24, // Daily sync
        config: {
          permitTypes: ['building', 'electrical', 'plumbing', 'renovation'],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${dataSources.length} data sources`);

  // Create a demo user (only in development)
  if (process.env.NODE_ENV === 'development') {
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@homehistory.com' },
      update: {},
      create: {
        email: 'demo@homehistory.com',
        name: 'Demo User',
        role: 'USER',
      },
    });

    console.log('✅ Created demo user:', demoUser.email);

    // Create a demo property
    const demoProperty = await prisma.property.upsert({
      where: { id: 'demo-property-1' },
      update: {},
      create: {
        id: 'demo-property-1',
        address: '123 Demo Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US',
        latitude: 37.7749,
        longitude: -122.4194,
        yearBuilt: 1990,
        squareFeet: 2500,
        lotSize: 0.15,
        bedrooms: 3,
        bathrooms: 2.5,
        propertyType: 'SINGLE_FAMILY',
        userId: demoUser.id,
      },
    });

    console.log('✅ Created demo property:', demoProperty.address);

    // Link property to data sources
    for (const dataSource of dataSources) {
      await prisma.propertyDataSource.create({
        data: {
          propertyId: demoProperty.id,
          dataSourceId: dataSource.id,
          syncStatus: 'PENDING',
        },
      });
    }

    console.log('✅ Linked demo property to all data sources');

    // Create a demo report
    const demoReport = await prisma.report.create({
      data: {
        propertyId: demoProperty.id,
        summary: 'This is a demo property report showcasing the HomeHistory platform capabilities.',
        incidentsJson: {
          incidents: [
            {
              date: '2023-06-15',
              type: 'water_damage',
              description: 'Minor water damage in basement',
              resolved: true,
            },
            {
              date: '2022-03-10',
              type: 'roof_repair',
              description: 'Roof shingles replaced',
              resolved: true,
            },
          ],
        },
        insuranceJson: {
          claims: [
            {
              date: '2023-06-20',
              type: 'water_damage',
              amount: 5000,
              status: 'approved',
            },
          ],
          coverage: {
            dwelling: 500000,
            personal_property: 250000,
            liability: 300000,
          },
        },
        aiInsights: {
          riskScore: 7.5,
          recommendations: [
            'Consider upgrading basement waterproofing',
            'Schedule annual roof inspection',
            'Update electrical panel (last updated 1990)',
          ],
          marketAnalysis: {
            estimatedValue: 850000,
            valueChange: '+12%',
            comparables: 5,
          },
        },
        status: 'published',
        publishedAt: new Date(),
      },
    });

    console.log('✅ Created demo report');

    // Create demo raw documents
    const documentTypes = [
      { type: 'permit', source: 'county_records' },
      { type: 'inspection', source: 'upload' },
      { type: 'insurance', source: 'upload' },
      { type: 'tax', source: 'tax_assessor' },
    ];

    for (const doc of documentTypes) {
      await prisma.rawDocument.create({
        data: {
          type: doc.type,
          source: doc.source,
          fileUrl: `https://storage.homehistory.com/demo/${doc.type}-sample.pdf`,
          propertyId: demoProperty.id,
          status: 'verified',
          extractedText: {
            content: `Sample ${doc.type} document content`,
            metadata: {
              pages: 1,
              extractedAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    console.log('✅ Created demo documents');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });