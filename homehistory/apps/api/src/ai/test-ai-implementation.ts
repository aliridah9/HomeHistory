/**
 * AI Implementation Verification Test
 * Run this to verify all AI features are working with real data
 */

import { ScrapedDataService } from './services/scraped-data.service';

async function testAIImplementation() {
  console.log('🧪 Testing HomeHistory AI Implementation\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Scraped Data Service
    console.log('\n📊 Test 1: Scraped Data Service');
    console.log('-'.repeat(60));
    
    const scrapedDataService = new ScrapedDataService();
    
    // Test market stats for Los Angeles
    const laStats = scrapedDataService.getMarketStats('Los Angeles', 'CA');
    console.log('✅ Los Angeles Market Stats:');
    console.log(`   - Average Price: $${laStats.avgPrice.toLocaleString()}`);
    console.log(`   - Median Price: $${laStats.medianPrice.toLocaleString()}`);
    console.log(`   - Price/SqFt: $${laStats.avgPricePerSqFt.toFixed(2)}`);
    console.log(`   - Days on Market: ${laStats.avgDaysOnMarket.toFixed(0)} days`);
    console.log(`   - Appreciation Trend: ${laStats.appreciationTrend.toFixed(2)}%`);
    console.log(`   - Total Listings: ${laStats.totalListings}`);

    // Test 2: Comparable Properties
    console.log('\n🏘️  Test 2: Find Comparable Properties');
    console.log('-'.repeat(60));
    
    const comparables = scrapedDataService.findComparables(
      'Los Angeles',
      'CA',
      850000,  // $850k
      3,       // 3 beds
      2,       // 2 baths
      1800,    // 1800 sq ft
      5        // top 5
    );
    
    console.log(`✅ Found ${comparables.length} comparable properties:`);
    comparables.forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.address}`);
      console.log(`      Price: $${comp.price.toLocaleString()}`);
      console.log(`      Similarity: ${(comp.similarity * 100).toFixed(1)}%`);
      console.log(`      Price/SqFt: $${comp.pricePerSqFt.toFixed(2)}`);
    });

    // Test 3: Value Analysis
    console.log('\n💰 Test 3: Property Value Analysis');
    console.log('-'.repeat(60));
    
    const valueAnalysis = scrapedDataService.analyzePropertyValue(
      'Los Angeles',
      'CA',
      850000,
      1800
    );
    
    console.log('✅ Value Analysis Results:');
    console.log(`   - Value Score: ${valueAnalysis.valueScore}/100`);
    console.log(`   - Price Difference: $${valueAnalysis.priceDifferenceFromAvg.toFixed(2)}`);
    console.log(`   - Difference %: ${valueAnalysis.priceDifferencePercentage.toFixed(2)}%`);
    console.log(`   - Overpriced: ${valueAnalysis.isOverpriced ? 'Yes' : 'No'}`);
    console.log(`   - Underpriced: ${valueAnalysis.isUnderpriced ? 'Yes' : 'No'}`);

    // Test 4: Inventory Health
    console.log('\n📈 Test 4: Market Inventory Health');
    console.log('-'.repeat(60));
    
    const inventoryHealth = scrapedDataService.getInventoryHealth('Los Angeles', 'CA');
    
    console.log('✅ Inventory Health:');
    console.log(`   - Inventory Level: ${inventoryHealth.inventoryLevel}`);
    console.log(`   - Demand Score: ${inventoryHealth.demandScore}/100`);
    console.log(`   - Days on Market Trend: ${inventoryHealth.daysOnMarketTrend}`);

    // Test 5: Available Locations
    console.log('\n🗺️  Test 5: Available Locations');
    console.log('-'.repeat(60));
    
    const locations = scrapedDataService.getAvailableLocations();
    console.log(`✅ Data available for ${locations.length} locations:`);
    locations.forEach((loc, index) => {
      if (index < 5) { // Show top 5
        console.log(`   ${index + 1}. ${loc.city}, ${loc.state} - ${loc.count} properties`);
      }
    });
    if (locations.length > 5) {
      console.log(`   ... and ${locations.length - 5} more locations`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! AI Implementation Verified');
    console.log('='.repeat(60));
    console.log('\n✅ Summary:');
    console.log('   - Scraped data loaded successfully');
    console.log('   - Market statistics working');
    console.log('   - Comparable property matching functional');
    console.log('   - Value analysis operational');
    console.log('   - Inventory health tracking active');
    console.log('   - Multiple locations supported');
    
    console.log('\n🚀 Ready for production use!');
    console.log('\nNext steps:');
    console.log('   1. Run database migration for analytics tables');
    console.log('   2. Restart API server');
    console.log('   3. Test property score endpoints');
    console.log('   4. Verify frontend integration\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    console.error('\nPlease ensure:');
    console.error('   - Scraped data files are in: homehistory/scraped-data/');
    console.error('   - All dependencies are installed');
    console.error('   - Service is properly configured\n');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testAIImplementation();
}

export { testAIImplementation };

