#!/bin/bash

# Benchmarking Script for Labradoor
# Compares performance before and after lazy loading

echo "🚀 Labradoor Performance Benchmarking"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
echo -e "${BLUE}Checking if dev server is running...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not running on http://localhost:3000${NC}"
    echo "Please start it with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Dev server is running${NC}"
echo ""

# Check if Cypress is installed
if ! command -v npx cypress &> /dev/null; then
    echo -e "${YELLOW}⚠️  Cypress not found. Installing...${NC}"
    npm install
fi

echo -e "${BLUE}Running baseline tests (without lazy loading)...${NC}"
echo "Make sure lazy loading is DISABLED in page.tsx"
echo ""
read -p "Press Enter when ready to run baseline tests..."

npx cypress run --spec "cypress/e2e/performance-baseline.cy.ts" --browser chrome --headless

echo ""
echo -e "${BLUE}Baseline tests complete!${NC}"
echo ""
echo -e "${YELLOW}Now enable lazy loading in page.tsx and press Enter to run optimized tests...${NC}"
read -p "Press Enter when ready..."

echo ""
echo -e "${BLUE}Running optimized tests (with lazy loading)...${NC}"
npx cypress run --spec "cypress/e2e/performance.cy.ts" --browser chrome --headless

echo ""
echo -e "${GREEN}✅ Benchmarking complete!${NC}"
echo "Compare the load times from both test runs above."

