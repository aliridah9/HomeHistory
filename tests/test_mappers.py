"""
Tests for ATTOM API data mappers.

Tests data transformation from ATTOM API responses to our standardized models.
"""

import pytest
from datetime import date, datetime
from hh_ingest.attom import (
    map_address_from_attom, map_property_core_from_attom, 
    map_tax_fact_from_attom, map_sale_records_from_attom,
    map_crime_stats_from_attom, map_schools_from_attom
)
from hh_ingest.schema import Address, PropertyCore, TaxFact, SaleRecord, CrimeStats, School


class TestATTOMAddressMapping:
    """Test ATTOM address data mapping."""
    
    def test_map_address_from_attom_complete(self):
        """Test mapping complete ATTOM address data."""
        attom_property = {
            "address": {
                "line1": "123 Main St",
                "locality": "Houston",
                "countrySubdivision": "TX", 
                "postal1": "77001"
            },
            "location": {
                "latitude": 29.7604,
                "longitude": -95.3698
            }
        }
        
        address = map_address_from_attom(attom_property)
        
        assert address is not None
        assert address.street == "123 Main St"
        assert address.city == "Houston"
        assert address.state == "TX"
        assert address.zip == "77001"
        assert address.lat == 29.7604
        assert address.lng == -95.3698
        assert address.full == "123 Main St, Houston, TX 77001"
    
    def test_map_address_from_attom_incomplete(self):
        """Test mapping incomplete ATTOM address data."""
        # Missing coordinates
        attom_property = {
            "address": {
                "line1": "123 Main St",
                "locality": "Houston",
                "countrySubdivision": "TX",
                "postal1": "77001"
            }
            # Missing location
        }
        
        address = map_address_from_attom(attom_property)
        assert address is None  # Should return None for incomplete data
        
        # Missing address components
        attom_property = {
            "address": {
                "line1": "123 Main St"
                # Missing locality, countrySubdivision, postal1
            },
            "location": {
                "latitude": 29.7604,
                "longitude": -95.3698
            }
        }
        
        address = map_address_from_attom(attom_property)
        assert address is None


class TestATTOMPropertyCoreMapping:
    """Test ATTOM property core data mapping."""
    
    def test_map_property_core_complete(self):
        """Test mapping complete ATTOM property data."""
        attom_property = {
            "address": {
                "line1": "123 Main St",
                "locality": "Houston",
                "countrySubdivision": "TX",
                "postal1": "77001"
            },
            "location": {
                "latitude": 29.7604,
                "longitude": -95.3698
            },
            "identifier": {
                "apn": "1234567890"
            },
            "building": {
                "propertyType": "SFR",
                "yearBuilt": "2020",
                "rooms": {
                    "beds": "3",
                    "baths": "2.5"
                },
                "stories": "2", 
                "size": {
                    "livingSize": "2500"
                },
                "construction": {
                    "type": "Frame"
                },
                "heating": "Central",
                "cooling": "Central Air"
            },
            "lot": {
                "lotSizeSquareFeet": "8000",
                "poolType": "In Ground"
            }
        }
        
        property_core = map_property_core_from_attom(attom_property)
        
        assert property_core is not None
        assert property_core.parcel_apn == "1234567890"
        assert property_core.property_type == "SFR"
        assert property_core.year_built == 2020
        assert property_core.beds == 3.0
        assert property_core.baths == 2.5
        assert property_core.stories == 2.0
        assert property_core.building_sqft == 2500
        assert property_core.lot_sqft == 8000
        
        # Check features
        assert "construction" in property_core.features
        assert "heating" in property_core.features
        assert "pool" in property_core.features
    
    def test_map_property_core_minimal(self):
        """Test mapping minimal ATTOM property data."""
        attom_property = {
            "address": {
                "line1": "456 Oak Ave",
                "locality": "Dallas",
                "countrySubdivision": "TX",
                "postal1": "75201"
            },
            "location": {
                "latitude": 32.7767,
                "longitude": -96.7970
            }
        }
        
        property_core = map_property_core_from_attom(attom_property)
        
        assert property_core is not None
        assert property_core.address.city == "Dallas"
        assert property_core.parcel_apn is None
        assert property_core.year_built is None
        assert property_core.beds is None
        assert property_core.features == {}


class TestATTOMTaxFactMapping:
    """Test ATTOM tax fact data mapping."""
    
    def test_map_tax_fact_complete(self):
        """Test mapping complete tax data."""
        attom_property = {
            "assessment": {
                "assessmentYear": "2023",
                "land": {
                    "assessedValue": "$150,000"
                },
                "building": {
                    "assessedValue": "$250,000"  
                },
                "assessedValue": "$400,000",
                "tax": {
                    "taxAmount": "$8,500"
                }
            }
        }
        
        tax_fact = map_tax_fact_from_attom(attom_property)
        
        assert tax_fact is not None
        assert tax_fact.year == 2023
        assert tax_fact.assessed_land == 15000000  # $150k in cents
        assert tax_fact.assessed_building == 25000000  # $250k in cents
        assert tax_fact.assessed_total == 40000000  # $400k in cents
        assert tax_fact.tax_amount == 850000  # $8.5k in cents
    
    def test_map_tax_fact_partial(self):
        """Test mapping partial tax data."""
        attom_property = {
            "assessment": {
                "assessmentYear": "2022",
                "assessedValue": "$350,000"
                # Missing other values
            }
        }
        
        tax_fact = map_tax_fact_from_attom(attom_property)
        
        assert tax_fact is not None
        assert tax_fact.year == 2022
        assert tax_fact.assessed_total == 35000000
        assert tax_fact.assessed_land is None
        assert tax_fact.assessed_building is None
        assert tax_fact.tax_amount is None
    
    def test_map_tax_fact_empty(self):
        """Test mapping empty tax data."""
        attom_property = {}  # No assessment data
        
        tax_fact = map_tax_fact_from_attom(attom_property)
        assert tax_fact is None


class TestATTOMSaleRecordsMapping:
    """Test ATTOM sales history data mapping."""
    
    def test_map_sale_records_complete(self):
        """Test mapping complete sales data."""
        attom_sales_data = {
            "saleshistory": [
                {
                    "saleSearchDate": "2023-06-15T00:00:00Z",
                    "saleAmount": "$425,000",
                    "deedType": "Warranty Deed",
                    "buyerName": "John Smith",
                    "sellerName": "Jane Doe",
                    "loan": {
                        "loanType": "Conventional",
                        "lenderName": "ABC Bank"
                    }
                },
                {
                    "recordingDate": "2020-03-20",
                    "saleAmount": "$380,000",
                    "deedType": "General Warranty Deed",
                    "buyerName": "Jane Doe",
                    "sellerName": "Builder Corp"
                }
            ]
        }
        
        sale_records = map_sale_records_from_attom(attom_sales_data)
        
        assert len(sale_records) == 2
        
        # First record
        record1 = sale_records[0]
        assert record1.sale_date == date(2023, 6, 15)
        assert record1.price == 42500000  # $425k in cents
        assert record1.deed_type == "Warranty Deed"
        assert record1.buyer == "John Smith"
        assert record1.seller == "Jane Doe"
        assert record1.loan_type == "Conventional"
        assert record1.lender == "ABC Bank"
        
        # Second record
        record2 = sale_records[1]
        assert record2.sale_date == date(2020, 3, 20)
        assert record2.price == 38000000  # $380k in cents
        assert record2.loan_type is None  # No loan info
    
    def test_map_sale_records_invalid_dates(self):
        """Test handling invalid date formats."""
        attom_sales_data = {
            "saleshistory": [
                {
                    "saleSearchDate": "invalid-date",
                    "saleAmount": "$300,000"
                },
                {
                    "recordingDate": "2021-12-31T23:59:59Z",
                    "saleAmount": "$320,000"
                }
            ]
        }
        
        sale_records = map_sale_records_from_attom(attom_sales_data)
        
        # Should skip invalid date, include valid one
        assert len(sale_records) == 1
        assert sale_records[0].sale_date == date(2021, 12, 31)
        assert sale_records[0].price == 32000000


class TestATTOMCrimeStatsMapping:
    """Test ATTOM crime statistics data mapping."""
    
    def test_map_crime_stats_complete(self):
        """Test mapping complete crime data."""
        attom_crime_data = {
            "crimedata": [
                {
                    "violentCrimePer1000": "12.5",
                    "propertyCrimePer1000": "45.8",
                    "crimeTrend1Year": "-5.2",
                    "crimeTrend5Year": "-12.8"
                }
            ]
        }
        
        crime_stats = map_crime_stats_from_attom(attom_crime_data)
        
        assert crime_stats is not None
        assert crime_stats.violent_per_1k == 12.5
        assert crime_stats.property_per_1k == 45.8
        assert crime_stats.trend_1y == -5.2
        assert crime_stats.trend_5y == -12.8
    
    def test_map_crime_stats_partial(self):
        """Test mapping partial crime data."""
        attom_crime_data = {
            "crimedata": [
                {
                    "violentCrimePer1000": "8.3",
                    # Missing other fields
                }
            ]
        }
        
        crime_stats = map_crime_stats_from_attom(attom_crime_data)
        
        assert crime_stats is not None
        assert crime_stats.violent_per_1k == 8.3
        assert crime_stats.property_per_1k is None
        assert crime_stats.trend_1y is None
        assert crime_stats.trend_5y is None
    
    def test_map_crime_stats_empty(self):
        """Test mapping empty crime data."""
        attom_crime_data = {"crimedata": []}
        
        crime_stats = map_crime_stats_from_attom(attom_crime_data)
        assert crime_stats is None


class TestATTOMSchoolsMapping:
    """Test ATTOM school data mapping."""
    
    def test_map_schools_complete(self):
        """Test mapping complete school data."""
        attom_schools_data = {
            "school": [
                {
                    "schoolName": "Washington Elementary",
                    "schoolType": "Elementary",
                    "gradesServed": "K-5",
                    "location": {
                        "latitude": "29.7650",
                        "longitude": "-95.3700"
                    },
                    "rating": "8/10",
                    "testScore": "85",
                    "parentRating": "4.2/5"
                },
                {
                    "schoolName": "Lincoln High School",
                    "schoolLevel": "High School",
                    "gradesServed": "9-12",
                    "location": {
                        "latitude": "29.7580", 
                        "longitude": "-95.3680"
                    },
                    "rating": "9/10"
                }
            ]
        }
        
        property_coords = (29.7604, -95.3698)  # Property location
        schools = map_schools_from_attom(attom_schools_data, property_coords)
        
        assert len(schools) == 2
        
        # First school
        school1 = schools[0]
        assert school1.name == "Washington Elementary"
        assert school1.level == "Elementary"
        assert school1.grades == "K-5"
        assert school1.distance_km is not None
        assert 0 < school1.distance_km < 2  # Should be close
        assert "attom" in school1.ratings
        assert "test_score" in school1.ratings
        assert "parent" in school1.ratings
        
        # Second school
        school2 = schools[1]
        assert school2.name == "Lincoln High School"
        assert school2.level == "High School"
        assert school2.distance_km is not None
        assert len(school2.ratings) == 1  # Only ATTOM rating
    
    def test_map_schools_no_coordinates(self):
        """Test mapping schools without property coordinates."""
        attom_schools_data = {
            "school": [
                {
                    "schoolName": "Test School",
                    "schoolType": "Elementary",
                    "location": {
                        "latitude": "29.7650",
                        "longitude": "-95.3700"
                    }
                }
            ]
        }
        
        schools = map_schools_from_attom(attom_schools_data, None)
        
        assert len(schools) == 1
        assert schools[0].name == "Test School"
        assert schools[0].distance_km is None  # No distance without property coords
    
    def test_map_schools_missing_data(self):
        """Test handling schools with missing data."""
        attom_schools_data = {
            "school": [
                {
                    # Missing schoolName - should be skipped
                    "schoolType": "Elementary"
                },
                {
                    "schoolName": "Valid School",
                    "schoolType": "Middle School"
                }
            ]
        }
        
        schools = map_schools_from_attom(attom_schools_data)
        
        # Should only include school with name
        assert len(schools) == 1
        assert schools[0].name == "Valid School"


class TestATTOMMapperEdgeCases:
    """Test edge cases and error handling in mappers."""
    
    def test_invalid_input_types(self):
        """Test mappers with invalid input types."""
        # None input
        assert map_address_from_attom(None) is None
        assert map_property_core_from_attom(None) is None
        assert map_tax_fact_from_attom(None) is None
        
        # Empty dict
        assert map_address_from_attom({}) is None
        assert map_property_core_from_attom({}) is None
        assert map_tax_fact_from_attom({}) is None
        
        # Wrong type input
        assert map_address_from_attom("not a dict") is None
        assert map_property_core_from_attom(123) is None
    
    def test_malformed_data_handling(self):
        """Test handling of malformed ATTOM data."""
        # Malformed address data
        malformed_property = {
            "address": "not a dict",  # Should be a dict
            "location": {
                "latitude": "invalid",  # Should be numeric
                "longitude": -95.3698
            }
        }
        
        address = map_address_from_attom(malformed_property)
        assert address is None
        
        # Malformed sales data with invalid prices
        malformed_sales = {
            "saleshistory": [
                {
                    "saleSearchDate": "2023-01-01",
                    "saleAmount": "not a price"  # Invalid price format
                }
            ]
        }
        
        sale_records = map_sale_records_from_attom(malformed_sales)
        # Should create record but with None price
        assert len(sale_records) == 1
        assert sale_records[0].price is None


if __name__ == "__main__":
    pytest.main([__file__])
