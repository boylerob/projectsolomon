#!/bin/bash

echo "🧹 Starting Documents folder cleanup..."
echo ""

# Create archive directory
mkdir -p ~/Documents/Archive

echo "🗑️  Removing unnecessary files..."

# Remove the large HTML file and its assets (3.7MB total)
if [ -f ~/Documents/All\ Bible\ Quotes\ from\ Jesus\ Christ\ of\ Nazareth\ -\ New\ International\ Version.html ]; then
    rm -rf ~/Documents/All\ Bible\ Quotes\ from\ Jesus\ Christ\ of\ Nazareth\ -\ New\ International\ Version.html
    echo "✅ Removed large HTML file"
fi

if [ -d ~/Documents/All\ Bible\ Quotes\ from\ Jesus\ Christ\ of\ Nazareth\ -\ New\ International\ Version_files ]; then
    rm -rf ~/Documents/All\ Bible\ Quotes\ from\ Jesus\ Christ\ of\ Nazareth\ -\ New\ International\ Version_files
    echo "✅ Removed HTML assets folder"
fi

# Remove compressed files
if [ -f ~/Documents/csj.txt.gz ]; then
    rm ~/Documents/csj.txt.gz
    echo "✅ Removed compressed file"
fi

# Remove .DS_Store files
find ~/Documents -name ".DS_Store" -delete 2>/dev/null
echo "✅ Removed .DS_Store files"

# Archive old files (optional - uncomment if you want to archive instead of delete)
# echo "📦 Archiving old files..."
# mv ~/Documents/fwmonarchpatentfiling10paradiselanewarwickus6.zip ~/Documents/Archive/ 2>/dev/null
# mv ~/Documents/Elizabeth_s_Wedding_Agreement.Executed.pdf ~/Documents/Archive/ 2>/dev/null
# mv ~/Documents/iDTC-CONFIRMATION\ FOR\ CREDIT\ CARD-Order1225328.pdf ~/Documents/Archive/ 2>/dev/null
# echo "✅ Archived old files"

echo ""
echo "📊 Current Documents folder size:"
du -sh ~/Documents

echo ""
echo "💡 If you still see 14GB in system storage, it might include:"
echo "   - iCloud Documents sync data"
echo "   - Time Machine local snapshots"
echo "   - System metadata and extended attributes"
echo ""
echo "🔍 To check for hidden large files:"
echo "   find ~/Documents -type f -size +1M -exec ls -lh {} \;" 