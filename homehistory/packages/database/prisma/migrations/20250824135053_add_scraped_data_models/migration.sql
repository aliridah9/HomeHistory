/*
  Warnings:

  - You are about to alter the column `quiet_hours_start` on the `notification_preferences` table. The data in that column could be lost. The data in that column will be cast from `Time(6)` to `Unsupported("time")`.
  - You are about to alter the column `quiet_hours_end` on the `notification_preferences` table. The data in that column could be lost. The data in that column will be cast from `Time(6)` to `Unsupported("time")`.

*/
-- AlterTable
ALTER TABLE "notification_preferences" ALTER COLUMN "quiet_hours_start" SET DATA TYPE time,
ALTER COLUMN "quiet_hours_end" SET DATA TYPE time;

-- AlterTable
ALTER TABLE "provider_accounts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "portals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "portalId" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceId" TEXT,
    "propertyType" TEXT,
    "status" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipcode" TEXT,
    "fullAddressRaw" TEXT,
    "priceUsd" INTEGER,
    "beds" DOUBLE PRECISION,
    "baths" DOUBLE PRECISION,
    "livingAreaSqft" INTEGER,
    "lotSizeSqft" DOUBLE PRECISION,
    "lotSizeAcres" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "daysOnMarket" INTEGER,
    "lastSoldPrice" INTEGER,
    "propertyTaxRate" DOUBLE PRECISION,
    "listingAgent" TEXT,
    "brokerageName" TEXT,
    "thumbnailUrl" TEXT,
    "virtualTourUrl" TEXT,
    "isZillowOwned" BOOLEAN,
    "description" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_listings" (
    "id" TEXT NOT NULL,
    "portalId" INTEGER NOT NULL,
    "title" TEXT,
    "businessName" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "location" TEXT,
    "priceUsd" INTEGER,
    "revenueUsd" INTEGER,
    "ebitdaUsd" INTEGER,
    "cashflowUsd" INTEGER,
    "employees" INTEGER,
    "yearEstablished" INTEGER,
    "state" TEXT,
    "sellerType" TEXT,
    "intermediaryFirm" TEXT,
    "intermediaryPhone" TEXT,
    "intermediaryName" TEXT,
    "inventoryRaw" TEXT,
    "reasonForSelling" TEXT,
    "description" TEXT,
    "dateAdded" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_images" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "business_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portals_name_key" ON "portals"("name");

-- CreateIndex
CREATE UNIQUE INDEX "listings_sourceUrl_key" ON "listings"("sourceUrl");

-- CreateIndex
CREATE INDEX "listings_city_state_zipcode_idx" ON "listings"("city", "state", "zipcode");

-- CreateIndex
CREATE INDEX "listings_portalId_propertyType_idx" ON "listings"("portalId", "propertyType");

-- CreateIndex
CREATE UNIQUE INDEX "business_listings_sourceUrl_key" ON "business_listings"("sourceUrl");

-- CreateIndex
CREATE INDEX "business_listings_portalId_idx" ON "business_listings"("portalId");

-- CreateIndex
CREATE INDEX "business_listings_state_idx" ON "business_listings"("state");

-- RenameForeignKey
ALTER TABLE "provider_accounts" RENAME CONSTRAINT "provider_accounts_user_fkey" TO "provider_accounts_userId_fkey";

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_listings" ADD CONSTRAINT "business_listings_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "portals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_images" ADD CONSTRAINT "business_images_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
