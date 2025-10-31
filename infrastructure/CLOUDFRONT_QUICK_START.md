# CloudFront Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Add Environment Variable

#### Vercel (Production)
```bash
# Dashboard: https://vercel.com → Project → Settings → Environment Variables
Name:  CLOUDFRONT_DOMAIN
Value: d1rfoqxjgv1gpt.cloudfront.net
```

#### Local Development
```bash
cd /home/ubuntu/projects/podcasto/podcasto
echo "CLOUDFRONT_DOMAIN=d1rfoqxjgv1gpt.cloudfront.net" >> .env.local
```

### Step 2: Redeploy

```bash
# Trigger Vercel redeploy
cd /home/ubuntu/projects/podcasto/podcasto
git commit --allow-empty -m "chore: enable CloudFront CDN"
git push origin master
```

### Step 3: Test

```bash
# Test CloudFront URL directly
curl -I https://d1rfoqxjgv1gpt.cloudfront.net/podcasts/test.wav

# Expected Response:
# HTTP/2 200
# x-cache: Miss from cloudfront (first time)
# x-cache: Hit from cloudfront (subsequent requests)
```

---

## 🔍 Quick Verification

### Is CloudFront Working?
```bash
# Check if app is using CloudFront
# Open browser → DevTools → Network → Play audio
# Audio URL should start with: https://d1rfoqxjgv1gpt.cloudfront.net/
```

### Cache Performance
```bash
# View CloudFront metrics
aws cloudfront get-distribution --id ENI2WO6H50E44 \
  --query 'Distribution.Status'
# Expected: "Deployed"
```

---

## 📊 Key Info

```
Distribution ID:    ENI2WO6H50E44
Domain:             d1rfoqxjgv1gpt.cloudfront.net
Status:             ✅ Deployed
Security:           ✅ S3 restricted to CloudFront only
```

---

## 🆘 Quick Troubleshooting

**403 Forbidden?**
→ Check S3 bucket policy allows CloudFront (already configured ✅)

**Audio not playing?**
→ Check `CLOUDFRONT_DOMAIN` env var in Vercel
→ Redeploy application

**Still using S3 direct?**
→ Verify env var is set
→ Check browser DevTools → Network tab → Audio URL

---

For detailed documentation, see:
- Full guide: `CLOUDFRONT_DEPLOYMENT_SUCCESS.md`
- Setup guide: `cloudfront-setup-guide.md`
- Project docs: `../CLAUDE.md`
