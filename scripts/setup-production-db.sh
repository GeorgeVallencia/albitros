#!/bin/bash

# Production Database Setup Script
# This script helps set up a production database for Albitros

echo "🚀 Setting up Albitros Production Database"

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    echo "Example: export DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\""
    exit 1
fi

echo "📊 Database URL detected: $DATABASE_URL"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Push schema to database
echo "📤 Pushing database schema..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    exit 1
fi

# Create default company (optional)
echo "🏢 Creating default company..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDefaultCompany() {
  try {
    const company = await prisma.company.upsert({
      where: { id: 'cmkp22c010000xl8khllyt6g6' },
      update: {},
      create: {
        id: 'cmkp22c010000xl8khllyt6g6',
        name: 'Default Company',
        size: 'SMALL',
        claimsVolume: 'UNDER_10K'
      }
    });
    console.log('✅ Default company created/updated:', company.name);
  } catch (error) {
    console.error('❌ Error creating default company:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

createDefaultCompany();
"

echo "✅ Production database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your production domain"
echo "2. Configure SSL certificate"
echo "3. Set up monitoring and backups"
echo "4. Deploy your application"
