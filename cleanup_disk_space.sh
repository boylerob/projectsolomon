#!/bin/bash

echo "🧹 Starting safe disk cleanup..."
echo "This will free up approximately 8-10GB of space"
echo ""

# 1. Clear old node_modules (safe to delete)
echo "🗑️  Removing old node_modules folders..."
rm -rf ~/Developer/ISA/isa-webapp/node_modules
rm -rf ~/Developer/Safest_Prototype/node_modules  
rm -rf ~/Developer/ISA/archive/old-development/ISA-App/node_modules
rm -rf ~/Developer/ISA/archive/old-development/node_modules
rm -rf ~/Developer/test-isa-app/node_modules
rm -rf ~/Developer/Safest_Prototype/sosCall/node_modules
echo "✅ Removed old node_modules"

# 2. Clear system caches
echo "🗑️  Clearing system caches..."
rm -rf ~/Library/Caches/com.google.SoftwareUpdate
rm -rf ~/Library/Caches/Google
rm -rf ~/Library/Caches/Adobe
rm -rf ~/Library/Caches/pip
rm -rf ~/Library/Caches/Adobe\ InDesign
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Caches/Homebrew
rm -rf ~/Library/Caches/puccinialin
rm -rf ~/Library/Caches/org.swift.swiftpm
rm -rf ~/Library/Caches/node-gyp
echo "✅ Cleared system caches"

# 3. Clear iOS simulators (optional - uncomment if you don't need them)
# echo "🗑️  Clearing iOS simulators..."
# rm -rf ~/Library/Developer/CoreSimulator
# echo "✅ Cleared iOS simulators"

# 4. Clear Xcode derived data (optional - uncomment if you use Xcode)
# echo "🗑️  Clearing Xcode derived data..."
# rm -rf ~/Library/Developer/Xcode/DerivedData
# echo "✅ Cleared Xcode derived data"

echo ""
echo "🎉 Cleanup complete!"
echo "Checking available disk space..."
df -h | grep -E "(Filesystem|/dev/disk1s5s1)"
echo ""
echo "💡 If you need more space, you can also:"
echo "   - Empty your Trash"
echo "   - Delete old downloads"
echo "   - Remove unused applications" 