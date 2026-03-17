# 🚀 QUICK SETUP GUIDE FOR AFTAB

## Your Supabase Credentials

**Database Password:** QgSniv_5Tu9+&Jt

**Project Name:** bakhsh-pos

**You need to get:**
1. Go to https://supabase.com/dashboard
2. Select your "bakhsh-pos" project
3. Go to Settings → API
4. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - anon/public key: `eyJhbGc...` (long key)

---

## Step 1: Set Up Your Environment

1. **Extract this zip** to: `D:\Laravel Projects\bakhsh-pos-nextjs`

2. **Copy `.env.local.example` to `.env.local`**

3. **Edit `.env.local`** and paste your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-key
   ```

---

## Step 2: Install Dependencies

Open PowerShell in the project folder:

```bash
cd "D:\Laravel Projects\bakhsh-pos-nextjs"
npm install
```

This will take 2-3 minutes.

---

## Step 3: Set Up Supabase Database

1. **Go to:** https://supabase.com/dashboard
2. **Select:** bakhsh-pos project
3. **Click:** SQL Editor (left sidebar)
4. **Copy and run ALL the SQL** from `SUPABASE-SETUP.sql` (I'll create this file)

---

## Step 4: Create Test Users

In Supabase Dashboard:

1. **Authentication → Users → Add User**

**Admin User:**
- Email: `admin@bakhshpos.com`
- Password: `admin123`
- Click "Create User"

**Then run this SQL:**
```sql
UPDATE profiles
SET role = 'admin', name = 'Admin'
WHERE email = 'admin@bakhshpos.com';
```

**Pharmacist User:**
- Email: `pharmacist@bakhshpos.com`
- Password: `pharma123`
- Click "Create User" (role will be pharmacist by default)

---

## Step 5: Run the App Locally

```bash
npm run dev
```

Open: http://localhost:3000

**Login with:**
- Email: admin@bakhshpos.com
- Password: admin123

---

## Step 6: Push to GitHub

```bash
cd "D:\Laravel Projects\bakhsh-pos-nextjs"

git init
git add .
git commit -m "Initial Next.js + Supabase setup"

# Connect to GitHub
git remote add origin https://github.com/sanwalbajwa/bakhsh-pos-nextjs.git
git branch -M main
git push -u origin main
```

**Make sure to create the repo first on GitHub!**

---

## Step 7: Deploy to Vercel

1. **Go to:** https://vercel.com
2. **Sign in** with GitHub
3. **Click:** "New Project"
4. **Import:** bakhsh-pos-nextjs repo
5. **Add Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`: (your URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (your key)
6. **Click:** "Deploy"

**Done in 2 minutes!** 🎉

Your app will be live at: `https://bakhsh-pos-nextjs.vercel.app`

---

## 📋 Checklist

- [ ] Extract zip to D:\Laravel Projects\bakhsh-pos-nextjs
- [ ] Create .env.local with Supabase credentials
- [ ] npm install
- [ ] Run SQL setup in Supabase
- [ ] Create admin + pharmacist users
- [ ] Test locally (npm run dev)
- [ ] Push to GitHub
- [ ] Deploy to Vercel

---

## 🐛 Troubleshooting

**Issue:** npm install fails
**Fix:** Make sure you're using Node.js 18+

**Issue:** Login doesn't work
**Fix:** Check .env.local has correct Supabase credentials

**Issue:** "User not found" error
**Fix:** Make sure you ran the SQL setup and created users

---

## 📞 Next Steps After Setup

Once this is working, I'll help you add:

1. ✅ Dashboard page (same design as React version)
2. ✅ Products CRUD (exact same UI)
3. ✅ All other features

---

**Total setup time: ~30 minutes** 🚀
