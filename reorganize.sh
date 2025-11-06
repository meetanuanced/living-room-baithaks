#!/bin/bash

# Living Room Baithaks - Repository Reorganization Script
# This script reorganizes the repo into a clean flat structure (Option A)

set -e  # Exit on any error

echo "🧹 Living Room Baithaks - Repository Cleanup"
echo "=============================================="
echo ""

# Verify we're in the right place
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository root!"
    echo "Please run this from: living-room-baithaks/"
    exit 1
fi

if [ ! -d "src/living_room_website" ]; then
    echo "❌ Error: src/living_room_website not found!"
    echo "Please verify you're in the correct directory."
    exit 1
fi

echo "✅ Verified: In correct directory"
echo ""

# Step 1: Create new folder structure
echo "📁 Step 1: Creating new folder structure..."
mkdir -p docs
mkdir -p data
echo "   Created: docs/"
echo "   Created: data/"
echo ""

# Step 2: Move website files to root
echo "📦 Step 2: Moving website files to root..."
mv src/living_room_website/index.html ./ 2>/dev/null || echo "   index.html already in place"
mv src/living_room_website/styles ./ 2>/dev/null || echo "   styles/ already in place"
mv src/living_room_website/scripts ./ 2>/dev/null || echo "   scripts/ already in place"
mv src/living_room_website/Images ./ 2>/dev/null || echo "   Images/ already in place"
mv src/living_room_website/Videos ./ 2>/dev/null || echo "   Videos/ already in place"
echo "   ✅ Moved: index.html, styles/, scripts/, Images/, Videos/"
echo ""

# Step 3: Move data files to data/
echo "📊 Step 3: Moving data files to data/..."
mv src/living_room_website/lrb_concerts_master_final_updated.json data/ 2>/dev/null || echo "   JSON already moved"
mv src/excel_input/LRB_Master_Data.xlsx data/ 2>/dev/null || echo "   Excel already moved"
echo "   ✅ Moved: JSON and Excel files to data/"
echo ""

# Step 4: Move essential documentation to docs/
echo "📚 Step 4: Moving documentation to docs/..."
mv MIGRATION_GUIDE.md docs/ 2>/dev/null || echo "   MIGRATION_GUIDE.md already moved"
mv GOOGLE_SHEETS_SETUP_RELATIONAL.md docs/ 2>/dev/null || echo "   GOOGLE_SHEETS_SETUP_RELATIONAL.md already moved"
mv STUDENT_SEATS_UPDATE.md docs/ 2>/dev/null || echo "   STUDENT_SEATS_UPDATE.md already moved"
mv HOW_TO_PROCEED.md docs/ 2>/dev/null || echo "   HOW_TO_PROCEED.md already moved"
mv IMPLEMENTATION_SUMMARY_RELATIONAL.md docs/ 2>/dev/null || echo "   IMPLEMENTATION_SUMMARY_RELATIONAL.md already moved"
mv BOOKINGS_EXCEL_TEMPLATE.md docs/ 2>/dev/null || echo "   BOOKINGS_EXCEL_TEMPLATE.md already moved"
echo "   ✅ Moved: Essential docs to docs/"
echo ""

# Step 5: Delete unnecessary files
echo "🗑️  Step 5: Removing unnecessary files..."

# Remove old/duplicate documentation
rm -f Code.gs 2>/dev/null && echo "   ✅ Deleted: Code.gs (duplicate)"
rm -f ENCODING_FIX.md 2>/dev/null && echo "   ✅ Deleted: ENCODING_FIX.md (old)"
rm -f GOOGLE_APPS_SCRIPT_SETUP.md 2>/dev/null && echo "   ✅ Deleted: GOOGLE_APPS_SCRIPT_SETUP.md (old)"
rm -f GOOGLE_SHEETS_SETUP.md 2>/dev/null && echo "   ✅ Deleted: GOOGLE_SHEETS_SETUP.md (old)"
rm -f IMPLEMENTATION_SUMMARY.md 2>/dev/null && echo "   ✅ Deleted: IMPLEMENTATION_SUMMARY.md (old)"
rm -f PULL_AND_TEST.md 2>/dev/null && echo "   ✅ Deleted: PULL_AND_TEST.md (old)"

# Remove test files
rm -f src/living_room_website/test_case_*.json 2>/dev/null && echo "   ✅ Deleted: test_case_*.json files"
rm -f src/living_room_website/test_cases.json 2>/dev/null && echo "   ✅ Deleted: test_cases.json"
rm -f src/living_room_website/test_validation_dashboard.html 2>/dev/null && echo "   ✅ Deleted: test_validation_dashboard.html"
rm -f src/living_room_website/index.html.backup 2>/dev/null && echo "   ✅ Deleted: index.html.backup"
rm -f src/living_room_website/README_CSS_REFACTOR.md 2>/dev/null && echo "   ✅ Deleted: README_CSS_REFACTOR.md"

# Remove archive folder
rm -rf src/living_room_website/archive 2>/dev/null && echo "   ✅ Deleted: archive/ folder"

# Remove .DS_Store files
find . -name ".DS_Store" -delete 2>/dev/null && echo "   ✅ Deleted: .DS_Store files"

echo ""

# Step 6: Remove now-empty src/ directory
echo "🧼 Step 6: Cleaning up empty directories..."
rm -rf src/living_room_website 2>/dev/null && echo "   ✅ Removed: src/living_room_website/"
rm -rf src/excel_input 2>/dev/null && echo "   ✅ Removed: src/excel_input/"
rmdir src 2>/dev/null && echo "   ✅ Removed: src/" || echo "   ⚠️  src/ not empty (check manually)"
echo ""

# Step 7: Show final structure
echo "✨ Step 7: Final structure:"
echo ""
echo "living-room-baithaks/"
echo "├── README.md              (to be created)"
echo "├── index.html             ✅"
echo "├── styles/                ✅"
echo "├── scripts/               ✅"
echo "├── Images/                ✅"
echo "├── Videos/                ✅"
echo "├── data/                  ✅"
echo "│   ├── lrb_concerts_master_final_updated.json"
echo "│   └── LRB_Master_Data.xlsx"
echo "├── docs/                  ✅"
echo "│   ├── MIGRATION_GUIDE.md"
echo "│   ├── GOOGLE_SHEETS_SETUP_RELATIONAL.md"
echo "│   ├── STUDENT_SEATS_UPDATE.md"
echo "│   └── ..."
echo "└── google_apps_script/    ✅"
echo "    └── Code.gs"
echo ""

echo "✅ Reorganization complete!"
echo ""
echo "Next steps:"
echo "1. Review the new structure: ls -la"
echo "2. Check docs folder: ls -la docs/"
echo "3. Check data folder: ls -la data/"
echo "4. Read README.md for next steps"
echo ""
