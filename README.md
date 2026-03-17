# Bakhsh POS - Next.js + Supabase

Healthcare Point of Sale System built with Next.js 15 and Supabase.

## 🚀 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19
- **Backend:** Next.js API Routes + Supabase
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel (Frontend) + Supabase (Backend)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sanwalbajwa/bakhsh-pos-nextjs.git
cd bakhsh-pos-nextjs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these from:** Supabase Dashboard → Settings → API

### 4. Set Up Supabase Database

Go to Supabase SQL Editor and run these commands:

#### Create Profiles Table (for user roles)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'pharmacist' CHECK (role IN ('admin', 'pharmacist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Create Products Table

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'piece',
  manufacturer TEXT,
  category TEXT DEFAULT 'Medicine',
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to manage products
CREATE POLICY "Admin users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### Create Trigger for Updated_At

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### Create Function to Create Profile on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pharmacist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 5. Create Test Users

Go to Supabase → Authentication → Users → Add User:

**Admin User:**
- Email: `admin@bakhshpos.com`
- Password: `admin123`
- After creating, update role in SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', name = 'Admin'
WHERE email = 'admin@bakhshpos.com';
```

**Pharmacist User:**
- Email: `pharmacist@bakhshpos.com`
- Password: `pharma123`
- Role will be 'pharmacist' by default

### 6. Seed Sample Products (Optional)

```sql
INSERT INTO products (name, generic_name, sku, barcode, price, cost_price, stock, manufacturer, category)
VALUES
  ('Panadol 500mg', 'Paracetamol', 'MED-001', '8964000180150', 10.00, 6.00, 500, 'GSK', 'Medicine'),
  ('Augmentin 625mg', 'Amoxicillin/Clavulanic Acid', 'MED-002', '8964000180167', 250.00, 180.00, 150, 'GSK', 'Medicine'),
  ('Surgical Face Mask', NULL, 'SUP-001', '8964000180174', 5.00, 2.50, 1000, 'Generic', 'Supplies'),
  ('Digital Thermometer', NULL, 'EQP-001', '8964000180181', 150.00, 90.00, 50, 'Omron', 'Equipment'),
  ('Brufen 400mg', 'Ibuprofen', 'MED-003', '8964000180198', 15.00, 9.00, 300, 'Abbott', 'Medicine');
```

## 🏃‍♂️ Running the Project

### Development Mode

```bash
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## 🎨 Color Scheme

- **Primary:** `#45457d`
- **Secondary:** `#07045e`

## 📁 Project Structure

```
bakhsh-pos-nextjs/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.jsx           # Root layout
│   ├── page.jsx             # Login page
│   ├── dashboard/           # Dashboard pages
│   └── api/                 # API routes (if needed)
├── components/              # Reusable components
├── lib/
│   └── supabase.js         # Supabase client
├── public/                  # Static assets
└── utils/                   # Utility functions
```

## 🔐 Default Login Credentials

**Admin:**
- Email: admin@bakhshpos.com
- Password: admin123

**Pharmacist:**
- Email: pharmacist@bakhshpos.com
- Password: pharma123

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

Your app will be live at: `https://your-app.vercel.app`

## 📝 Next Steps

1. ✅ Login page (Complete!)
2. ⏳ Dashboard layout
3. ⏳ Products CRUD
4. ⏳ POS module
5. ⏳ Reports

## 🛠️ Development Workflow

After making changes:

```bash
git add .
git commit -m "Your message"
git push origin main
```

Vercel will auto-deploy!

## 📞 Support

For issues or questions, contact the development team.

---

Built with ❤️ for Bakhsh Healthcare Center
