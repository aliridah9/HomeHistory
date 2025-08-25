"""Initial database schema for HomeHistory ingestion system

Revision ID: 001
Revises: 
Create Date: 2025-08-22 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial database schema for property data ingestion."""
    
    # Create properties table
    op.create_table(
        'properties',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('street', sa.String(length=200), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=2), nullable=False),
        sa.Column('zip_code', sa.String(length=10), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('parcel_apn', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('street', 'city', 'state', 'zip_code', name='uq_property_address'),
        sa.UniqueConstraint('parcel_apn', name='uq_property_apn')
    )
    
    # Create indexes for properties table
    op.create_index('idx_property_coords', 'properties', ['lat', 'lng'])
    op.create_index('idx_property_state_city', 'properties', ['state', 'city'])
    op.create_index('idx_property_updated', 'properties', ['updated_at'])
    op.create_index('idx_property_apn', 'properties', ['parcel_apn'])
    
    # Create facts_core table
    op.create_table(
        'facts_core',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('core', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('property_id')
    )
    
    # Create indexes for facts_core table
    op.create_index('idx_core_facts_property', 'facts_core', ['property_id'])
    op.create_index('idx_core_facts_jsonb', 'facts_core', ['core'], postgresql_using='gin')
    
    # Create tax_facts table
    op.create_table(
        'tax_facts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tax', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('property_id')
    )
    
    # Create indexes for tax_facts table
    op.create_index('idx_tax_facts_property', 'tax_facts', ['property_id'])
    op.create_index('idx_tax_facts_jsonb', 'tax_facts', ['tax'], postgresql_using='gin')
    
    # Create sale_records table
    op.create_table(
        'sale_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sale_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('price', sa.Integer(), nullable=True),
        sa.Column('deed_type', sa.String(length=100), nullable=True),
        sa.Column('buyer', sa.String(length=200), nullable=True),
        sa.Column('seller', sa.String(length=200), nullable=True),
        sa.Column('loan_type', sa.String(length=100), nullable=True),
        sa.Column('lender', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('property_id', 'sale_date', 'price', name='uq_sale_record')
    )
    
    # Create indexes for sale_records table
    op.create_index('idx_sale_records_property', 'sale_records', ['property_id'])
    op.create_index('idx_sale_records_date', 'sale_records', ['sale_date'])
    op.create_index('idx_sale_records_price', 'sale_records', ['price'])
    
    # Create listings table
    op.create_table(
        'listings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('url', sa.String(length=2000), nullable=False),
        sa.Column('status', sa.String(length=100), nullable=True),
        sa.Column('list_price', sa.Integer(), nullable=True),
        sa.Column('dom', sa.Integer(), nullable=True),
        sa.Column('beds', sa.Float(), nullable=True),
        sa.Column('baths', sa.Float(), nullable=True),
        sa.Column('sqft', sa.Integer(), nullable=True),
        sa.Column('lot_sqft', sa.Integer(), nullable=True),
        sa.Column('year_built', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_history', postgresql.JSONB(astext_type=sa.Text()), nullable=False, default=sa.text("'[]'::jsonb")),
        sa.Column('agent', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source', 'url', name='uq_listing_source_url')
    )
    
    # Create indexes for listings table
    op.create_index('idx_listings_property', 'listings', ['property_id'])
    op.create_index('idx_listings_source', 'listings', ['source'])
    op.create_index('idx_listings_price', 'listings', ['list_price'])
    op.create_index('idx_listings_updated', 'listings', ['updated_at'])
    op.create_index('idx_listings_active', 'listings', ['is_active'])
    
    # Create listing_photos table
    op.create_table(
        'listing_photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('listing_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('url', sa.String(length=2000), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('listing_id', 'url', name='uq_listing_photo_url')
    )
    
    # Create indexes for listing_photos table
    op.create_index('idx_listing_photos_listing', 'listing_photos', ['listing_id'])
    op.create_index('idx_listing_photos_order', 'listing_photos', ['order_index'])


def downgrade() -> None:
    """Drop all tables and indexes."""
    
    # Drop tables in reverse order of creation (respecting foreign key constraints)
    op.drop_table('listing_photos')
    op.drop_table('listings')
    op.drop_table('sale_records')
    op.drop_table('tax_facts')
    op.drop_table('facts_core')
    op.drop_table('properties')
