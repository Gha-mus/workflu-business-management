#!/bin/bash

# WorkFlu Automatic GitHub Sync Script
# This script provides seamless synchronization between Replit and GitHub

echo "🔄 WorkFlu Auto-Sync to GitHub"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}❌ Not a git repository. Initializing...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
fi

# Check if GitHub remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ No GitHub remote configured.${NC}"
    echo "Please set your GitHub repository URL:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/workflu-business-management.git"
    exit 1
fi

# Get current status
echo -e "${YELLOW}📊 Current repository status:${NC}"
git status --short

# Add all changes
echo -e "${YELLOW}📦 Staging all changes...${NC}"
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${GREEN}✅ No changes to sync - repository is up to date${NC}"
    echo -e "${YELLOW}📍 Latest commit:${NC}"
    git log --oneline -1
    exit 0
fi

# Show what will be committed
echo -e "${YELLOW}📋 Changes to be committed:${NC}"
git diff --staged --stat

# Generate commit message with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
COMMIT_MSG="Auto-sync from Replit: $TIMESTAMP"

# Check for specific types of changes
if git diff --staged --name-only | grep -q "server/storage.ts"; then
    COMMIT_MSG="Fix: Update server storage implementation - $TIMESTAMP"
elif git diff --staged --name-only | grep -q "\.tsx\?$"; then
    COMMIT_MSG="UI: Update frontend components - $TIMESTAMP"
elif git diff --staged --name-only | grep -q "shared/schema.ts"; then
    COMMIT_MSG="Schema: Update database schema - $TIMESTAMP"
fi

echo -e "${YELLOW}💬 Commit message: $COMMIT_MSG${NC}"

# Commit changes
if git commit -m "$COMMIT_MSG"; then
    echo -e "${GREEN}✅ Changes committed successfully${NC}"
else
    echo -e "${RED}❌ Failed to commit changes${NC}"
    exit 1
fi

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo -e "${GREEN}🎉 Successfully synced to GitHub!${NC}"
    
    # Get repository URL
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    echo -e "${GREEN}📍 View your repository: $REPO_URL${NC}"
    echo -e "${GREEN}🔍 Check Actions tab for error detection: $REPO_URL/actions${NC}"
    
    # Show recent commits
    echo -e "${YELLOW}📜 Recent commits:${NC}"
    git log --oneline -5
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Please check your GitHub connection and permissions"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Sync complete! Your WorkFlu project is now updated on GitHub.${NC}"
echo -e "${YELLOW}🔍 GitHub will automatically check for:${NC}"
echo "   • TypeScript compilation errors"
echo "   • ESLint issues and code quality problems"
echo "   • Database schema validation"
echo "   • Build failures and dependency issues"
echo "   • Import/export problems"