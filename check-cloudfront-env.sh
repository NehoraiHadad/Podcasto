#!/bin/bash
echo "🔍 בדיקת משתני סביבה CloudFront"
echo "================================"
echo ""

# Check local .env.local
echo "📝 Local .env.local:"
if [ -f "podcasto/.env.local" ]; then
    grep CLOUDFRONT_DOMAIN podcasto/.env.local || echo "❌ CLOUDFRONT_DOMAIN לא קיים ב-.env.local"
else
    echo "❌ קובץ .env.local לא קיים"
fi

echo ""
echo "================================"
echo "⚠️  חשוב לבדוק גם ב-Vercel Dashboard:"
echo ""
echo "1. לך ל: https://vercel.com"
echo "2. בחר: Podcasto project"
echo "3. Settings → Environment Variables"
echo "4. וודא שקיים:"
echo "   Name:  CLOUDFRONT_DOMAIN"
echo "   Value: d1rfoqxjgv1gpt.cloudfront.net"
echo "   ✓ Production"
echo "   ✓ Preview"
echo "   ✓ Development"
echo ""
echo "5. אם המשתנה לא קיים או שונה - הוסף אותו"
echo "6. אחרי הוספה: Deployments → Latest → Redeploy"
echo "================================"
