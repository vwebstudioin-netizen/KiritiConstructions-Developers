# Kiriti Constructions & Developers Pvt. Ltd. — Deployment Guide

Complete step-by-step guide to deploy this project live on Vercel with Firebase backend.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Firebase Setup](#2-firebase-setup)
3. [Firestore Security Rules](#3-firestore-security-rules)
4. [Firebase Storage Rules](#4-firebase-storage-rules)
5. [Environment Variables](#5-environment-variables)
6. [Gmail SMTP Setup (Email)](#6-gmail-smtp-setup-email)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Post-Deployment Setup](#8-post-deployment-setup)
9. [Creating the Admin Account](#9-creating-the-admin-account)
10. [Creating Supervisor Accounts](#10-creating-supervisor-accounts)
11. [Adding Your First Project](#11-adding-your-first-project)
12. [Maintenance & Updates](#12-maintenance--updates)

---

## 1. Prerequisites

Before starting, make sure you have:

- A **GitHub account** — the code must be pushed to a GitHub repo
- A **Google account** — for Firebase
- A **Vercel account** — free tier is fine (vercel.com)
- A **Gmail account** — for sending email notifications
- Node.js 18+ installed on your computer

---

## 2. Firebase Setup

### Step 1 — Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `kiriti-constructions` (or any name you prefer)
4. Disable Google Analytics (not needed) → click **"Create project"**
5. Wait for it to be created → click **"Continue"**

---

### Step 2 — Enable Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** → click **Next**
4. Choose region: **asia-south1 (Mumbai)** → click **Enable**
5. Wait for Firestore to be created

---

### Step 3 — Enable Firebase Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab, click **"Email/Password"**
4. Toggle **"Enable"** → click **"Save"**

---

### Step 4 — Enable Firebase Storage

1. In the left sidebar, click **"Storage"**
2. Click **"Get started"**
3. Select **"Start in production mode"** → click **Next**
4. Choose region: **asia-south1** → click **Done**

---

### Step 5 — Get Firebase Config Keys

1. In Firebase Console, click the **gear icon** (top left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click **"</>"** (Web app icon) to add a web app
4. Enter app nickname: `kiriti-constructions-web` → click **"Register app"**
5. You will see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kiriti-constructions.firebaseapp.com",
  projectId: "kiriti-constructions",
  storageBucket: "kiriti-constructions.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Copy these values** — you will need them in Step 5.

---

## 3. Firestore Security Rules

1. In Firebase Console → **Firestore Database** → **Rules** tab
2. **Select all** existing text → **delete it** → paste the rules below exactly → click **Publish**

> Note: Make sure line 1 starts with `rules_version` — no spaces or characters before it.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    // ── Public website data (read by anyone) ─────────────────────
    match /company/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /services/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /team/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /testimonials/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /blog/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /gallery/{doc} {
      allow read: if true;
      allow write: if isAuth();
    }

    // ── Projects + all subcollections ────────────────────────────
    match /projects/{projectId} {
      allow read: if true;
      allow write: if isAuth();

      match /milestones/{id} {
        allow read: if isAuth();
        allow write: if isAuth();
      }
      match /documents/{id} {
        allow read: if true;
        allow write: if isAuth();
      }
      match /materials/{id} {
        allow read, write: if isAuth();
      }
      match /transactions/{id} {
        allow read, write: if isAuth();
      }
      match /dailyReports/{id} {
        allow read, write: if isAuth();
      }
      match /team/{id} {
        allow read, write: if isAuth();
      }
      match /expenses/{id} {
        allow read, write: if isAuth();
      }
      match /vendors/{id} {
        allow read, write: if isAuth();
      }
      match /vendorOrders/{id} {
        allow read, write: if isAuth();
      }
      match /units/{id} {
        allow read: if true;
        allow write: if isAuth();
      }
    }

    // ── Client portal ────────────────────────────────────────────
    match /clients/{id} {
      allow read, write: if isAuth();
    }

    // ── Supervisor portal ────────────────────────────────────────
    match /supervisors/{id} {
      allow read, write: if isAuth();
    }

    // ── Payments ─────────────────────────────────────────────────
    match /payments/{id} {
      allow read, write: if isAuth();
    }

    // ── Quote requests (public form — unauthenticated visitors) ──
    // write: if true — allows website visitors to submit quote form
    match /enquiries/{id} {
      allow read: if isAuth();
      allow write: if true;
    }

    // ── Admin quotes (PDF quote generator) ───────────────────────
    match /quotes/{id} {
      allow read, write: if isAuth();
    }

    // ── Inventory Projects & Units (public read, admin write) ─────
    match /inventoryProjects/{projectId} {
      allow read: if true;
      allow write: if isAuth();
      match /units/{unitId} {
        allow read: if true;
        allow write: if isAuth();
      }
    }

    // ── Unit Enquiries (public submit, admin reads) ───────────────
    match /unitEnquiries/{id} {
      allow read: if isAuth();
      allow write: if true;
    }
  }
}
```

> **Important:**
> - `enquiries` — `write: if true` so website visitors can submit quote forms without logging in
> - `unitEnquiries` — `write: if true` so customers can enquire about plots/apartments without an account
> - `inventoryProjects` and `units` — public read so anyone can see availability in real-time

---

## 4. Firebase Storage Rules

1. In Firebase Console → **Storage** → **Rules** tab
2. Replace with the following and click **Publish**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Anyone can read files (images, documents)
    match /{allPaths=**} {
      allow read: if true;
      // Only authenticated users can upload/delete
      allow write: if request.auth != null;
    }
  }
}
```

---

## 5. Environment Variables

Create a file named `.env.local` in the root of the project folder (copy from `.env.local.example`):

```bash
# ── Firebase Client SDK ──────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ── Firebase Admin SDK (for seeding data) ───────────────────────
# Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Minify the downloaded JSON (remove all newlines) and paste it here as one line
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# ── Email Notifications (Gmail SMTP) ────────────────────────────
SMTP_EMAIL=yourcompany@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx     # Gmail App Password (16 chars)
ADMIN_EMAIL=admin@kiriticonstructions.com

# ── Admin WhatsApp (for low stock alerts) ───────────────────────
ADMIN_WHATSAPP=919386655555            # Country code + number, no + or spaces
```

> **Never commit .env.local to GitHub.** It is already in .gitignore.

### How to get the Firebase Admin Service Account Key

1. Firebase Console → gear icon → **Project Settings**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"** → **Generate key**
4. A `.json` file downloads — open it in any text editor
5. Copy the entire content
6. Minify it (remove all line breaks) — paste into [jsonminifier.com](https://jsonminifier.com) or use `Ctrl+H` in VS Code to replace `\n` with nothing
7. Set the minified JSON as the value of `FIREBASE_ADMIN_CREDENTIALS` in `.env.local`
8. Add the same variable in **Vercel → Project Settings → Environment Variables**

> The Admin SDK is only used server-side for seeding. It bypasses Firestore security rules safely.

---

## 6. Gmail SMTP Setup (Email)

The app sends emails for:
- Quote request alerts to admin
- Payment receipt to client
- Low stock alerts to admin
- Milestone completion notifications

### Enable Gmail App Password

1. Go to your Gmail account → click your profile → **"Manage your Google Account"**
2. Go to the **Security** tab
3. Under **"How you sign in to Google"**, enable **2-Step Verification** (if not already)
4. After enabling 2FA, go back to Security → search **"App passwords"**
5. Click **"App passwords"**
6. Select app: **"Mail"** → Select device: **"Other"** → type `TalatamKiritiInfra`
7. Click **Generate** → copy the 16-character password shown

Use this 16-character password as `SMTP_PASSWORD` in your `.env.local`.

> Example: `SMTP_PASSWORD=abcd efgh ijkl mnop`

---

## 7. Deploy to Vercel

### Step 1 — Push code to GitHub

```bash
# In the project folder
cd "path/to/TalatamKiritiInfra"

git init
git add .
git commit -m "Initial deployment: Kiriti Constructions & Developers"

# Create a new repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/kiriti-constructions.git
git branch -M main
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Log in**
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `kiriti-constructions` repository → click **Import**
5. Framework Preset: **Next.js** (auto-detected)
6. Root Directory: leave as **`./`**
7. **Do NOT deploy yet** — first add environment variables below

### Step 3 — Add Environment Variables in Vercel

1. In the Vercel project setup page, scroll down to **"Environment Variables"**
2. Add ALL variables from your `.env.local` file one by one:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your-project-id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID |
| `SMTP_EMAIL` | yourcompany@gmail.com |
| `SMTP_PASSWORD` | Your Gmail App Password |
| `ADMIN_EMAIL` | admin email address |
| `ADMIN_WHATSAPP` | 91XXXXXXXXXX (no + sign) |

3. Click **"Deploy"**
4. Wait 2–3 minutes for the build to complete
5. Your site will be live at: `https://kiriti-constructions.vercel.app`

### Step 4 — Add Custom Domain (Optional)

1. In your Vercel project → **Settings** → **Domains**
2. Enter your domain: e.g., `kiriticonstructions.com`
3. Follow the DNS instructions to point your domain to Vercel
4. Vercel automatically provides free SSL (HTTPS)

---

## 8. Post-Deployment Setup

After your site is live, complete these steps in order:

### A. Seed Company Information

1. Go to your live site → `/admin/login`
2. Log in with your admin account (see Step 9 below)
3. Go to **Settings** → update:
   - Company name, tagline, description
   - Phone, WhatsApp number, email
   - Address
   - Opening hours
   - Social media links
4. Click **"Save All Settings"**

### B. Add Services

1. Go to **Admin → Services**
2. Add your construction services (Residential, Commercial, Renovation, Civil, Interior)

### C. Add Projects

1. Go to **Admin → Projects**
2. Add your ongoing and completed projects
3. For each ongoing project, go to the project detail page and click **"Add Default Materials"** to pre-fill standard construction materials

---

## 9. Creating the Admin Account

The admin account must be created **manually in Firebase Console**:

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter:
   - **Email:** admin@kiriticonstructions.com (or your preferred email)
   - **Password:** Choose a strong password (min 8 characters)
4. Click **"Add user"**

Now you can log in at `/admin/login` with these credentials.

> **Keep this password safe.** Only the admin should have this login.

---

## 10. Creating Supervisor Accounts

Supervisors are created from inside the admin panel:

1. Log in to admin → go to **Admin → Supervisors**
2. Fill in:
   - Full Name
   - Phone number
   - Email (this will be their login email)
   - Temporary Password (they should change it after first login)
   - Select which projects to assign to them
3. Click **"Create Supervisor Account"**

The supervisor can now log in at `/supervisor/login` with their email and password.

> To add more projects to a supervisor later: go to Admin → Supervisors → click "Assign" button next to their name.

---

## 11. Adding Your First Project

Here's the full workflow for a new construction project:

### Step 1 — Create the Project
1. Admin → **Projects** → click **"Add Project"**
2. Fill in title, location, category, status, total value
3. Assign to a client (if client has a portal account)
4. Set status to `ongoing`

### Step 2 — Add Materials
1. Click the project → go to **Materials** tab
2. Click **"Add Default Materials"** — this adds Sand, Cement, Steel Rods, etc.
3. Customize thresholds as needed (when to send low stock alerts)
4. Add any additional project-specific materials

### Step 3 — Assign Supervisor
1. Admin → **Supervisors** → click **"Assign"** next to the supervisor
2. Toggle the project to assign it

### Step 4 — Add Site Team
1. Admin → Project → **Team** tab
2. Add site engineer, foremen, and key workers

### Step 5 — Supervisor Starts Logging
1. Supervisor logs in at `/supervisor`
2. They see their assigned sites
3. Each day they:
   - Log material movements (received / used) in **Log Entry** tab
   - Submit daily report in **Daily Report** tab

### Step 6 — Admin Monitors
1. Admin dashboard shows today's reports and low stock alerts
2. When stock is low → email sent automatically + WhatsApp button appears
3. Admin checks **Materials** tab on each project for inventory status

---

## 12. Maintenance & Updates

### To Update Content
- All content (projects, services, team, blog) is managed from `/admin`
- No code changes needed for content updates

### To Update Code
```bash
# Make changes locally
git add .
git commit -m "your change description"
git push origin main
```
Vercel will automatically redeploy when you push to GitHub.

### To Redeploy Manually
1. Go to your Vercel dashboard
2. Click your project → **Deployments** tab
3. Click **"Redeploy"** on the latest deployment

### Firebase Backups
- In Firebase Console → Firestore → **Import/Export** for manual backups
- Set up automatic daily backups: Firebase Console → Firestore → **Backups** (Blaze plan)

### Upgrading Firebase Plan
The free Spark plan is sufficient for:
- Up to 50K reads/day
- Up to 20K writes/day
- Up to 1GB storage

If you exceed these limits, upgrade to **Blaze (pay-as-you-go)** in Firebase Console → gear icon → **Usage and billing**.

---

## URL Summary

### Public Pages

| URL | Purpose |
|---|---|
| `/` | Home — hero, services, projects, stats, testimonials, CTA |
| `/about` | About the company — story, values, team |
| `/services` | All services listing |
| `/services/residential-construction` | Individual service detail |
| `/services/commercial-construction` | Individual service detail |
| `/services/home-renovation` | Individual service detail |
| `/services/interior-design` | Individual service detail |
| `/services/civil-work` | Individual service detail |
| `/services/painting-waterproofing` | Individual service detail |
| `/projects` | All projects with category filter |
| `/projects/[slug]` | Individual project detail |
| `/blog` | Blog & news listing |
| `/blog/[slug]` | Individual blog post |
| `/contact` | Contact page with map and hours |
| `/quote` | Get a free quote form |

### Client Portal

| URL | Who uses it | Purpose |
|---|---|---|
| `/client/login` | Clients | Client portal login |
| `/client/dashboard` | Clients | Overview, upcoming appointments, loyalty |
| `/client/projects` | Clients | All assigned projects |
| `/client/projects/[id]` | Clients | Project detail — milestones, documents, payments |
| `/client/payments` | Clients | Payment history and pending dues |
| `/client/documents` | Clients | Download shared documents |

### Supervisor Portal

| URL | Who uses it | Purpose |
|---|---|---|
| `/supervisor/login` | Supervisors | Supervisor login (separate from admin) |
| `/supervisor` | Supervisors | Assigned sites dashboard with today's status |
| `/supervisor/[projectId]` | Supervisors | Log materials, daily reports, view team |

### Admin Panel

| URL | Who uses it | Purpose |
|---|---|---|
| `/admin/login` | Admin only | Admin login |
| `/admin` | Admin | Dashboard — revenue, alerts, today's reports, low stock |
| `/admin/projects` | Admin | All projects list |
| `/admin/projects/[id]` | Admin | Project detail — 9 tabs (Overview, Materials, Log Entry, Transactions, Daily Report, Team, Milestones, Documents, Payments) |
| `/admin/supervisors` | Admin | Create & manage supervisor accounts |
| `/admin/clients` | Admin | Client accounts |
| `/admin/payments` | Admin | All payments + Mark as Paid + WhatsApp receipt |
| `/admin/services` | Admin | Manage services |
| `/admin/team` | Admin | Manage company team |
| `/admin/blog` | Admin | Write and publish blog posts |
| `/admin/enquiries` | Admin | Quote request pipeline |
| `/admin/settings` | Admin | Company info, hours, social links |

### API Routes (Internal)

| URL | Purpose |
|---|---|
| `POST /api/quote` | Submit quote form — saves to DB + sends email |
| `POST /api/payments/mark-paid` | Mark payment as paid — sends email receipt |
| `POST /api/alert/low-stock` | Send low stock email + return WhatsApp URL |

---

## How to Add a New Project — Step by Step

This is the full workflow from creating a project to having a supervisor log materials on site.

---

### Step 1 — Create the Project

1. Log in to **Admin Panel** → go to `/admin/projects`
2. Click **"Add Project"** (top right)
3. Fill in the form:

| Field | What to enter |
|---|---|
| **Title** | e.g. `4BHK Villa — Kondapur` |
| **Category** | Residential / Commercial / Renovation / Interior |
| **Status** | Start with `planning`, change to `ongoing` when work begins |
| **Location** | e.g. `Kondapur, Hyderabad` |
| **Year** | Current year e.g. `2025` |
| **Total Value (₹)** | Contract value e.g. `4500000` (= ₹45 Lakhs) |
| **Description** | Brief project description |
| **Assign to Client** | Select client if they have a portal login (optional) |

4. Click **"Add"** — project is created and appears in the list

---

### Step 2 — Open the Project and Add Materials

1. Click the **gear icon** next to the project to open it
2. Go to the **Materials** tab
3. Click **"Add Default Materials"** — this pre-fills all standard construction materials (Sand, Cement, Steel Rods, Bricks, etc.)
4. You can also add custom materials manually (e.g. Tiles, Paint)
5. Adjust the **Low Stock Threshold** for each material — admin gets an email + WhatsApp when balance drops below this number

---

### Step 3 — Add the Site Team

1. On the same project page → go to **Team** tab
2. Add each person working on this site:
   - Site Engineer name, role, phone
   - Foreman, Mason, etc.
3. This team list is visible to the supervisor for reference

---

### Step 4 — Create a Supervisor Account

1. Go to **Admin → Supervisors** (`/admin/supervisors`)
2. Click **"Add New Supervisor"**
3. Fill in:
   - Full Name
   - Phone number
   - Email (this will be their login username)
   - Temporary Password (min 6 characters — tell them to note it)
4. Under **"Assign Projects"** — check the project you just created
5. Click **"Create Supervisor Account"**

The supervisor can now log in at `/supervisor/login`

---

### Step 5 — Share Supervisor Login with Site Staff

Send the supervisor this information:

```
Login URL: https://yoursite.com/supervisor/login
Email: their-email@domain.com
Password: the-temp-password-you-set
```

Tell them to:
1. Open the URL on their phone
2. Log in with email and password
3. They will see all sites assigned to them

---

### Step 6 — Supervisor Starts Logging (Daily Workflow)

Every day on site, the supervisor:

**Morning:**
1. Log in to their portal
2. Tap the project
3. Go to **Log Entry** tab
4. When materials arrive → select material → tap **"Received"** → enter quantity → Submit
5. As materials are used → select material → tap **"Used"** → enter quantity → Submit

**End of Day:**
1. Go to **Daily Report** tab
2. Fill in:
   - Work done today (describe what was completed)
   - Number of workers present
   - Weather condition
   - Materials summary (brief note)
   - Any issues or delays
3. Tap **"Submit Report"**

---

### Step 7 — Admin Monitors the Site

The admin can see:

| Where to look | What you see |
|---|---|
| **Admin Dashboard** | Today's reports from all sites, low stock alerts |
| **Project → Overview** | Milestone progress, payment status, last daily report |
| **Project → Materials** | Inventory table — inward vs consumed vs balance for each material |
| **Project → Transactions** | Every entry logged with date, supervisor, quantity |
| **Project → Daily Reports** | All past reports in reverse order |

**When stock goes low:**
- Admin gets an automatic email alert
- A **"Send WhatsApp Alert"** button appears — click it to notify the supplier or team via WhatsApp instantly

---

### Step 8 — Add Milestones and Track Progress

1. Project → **Milestones** tab
2. Add milestones (e.g. Foundation Complete, Ground Floor Slab, First Floor, Finishing, Handover)
3. As each milestone is done → click the status button to mark it **Completed**
4. If the project has a client portal user — they automatically get an email when a milestone is marked complete

---

### Step 9 — Record Payments

1. Project → **Payments** tab
2. Click **"Create Payment Request"** → enter description and amount
3. When client pays → click **"Mark as Paid"**
   - Email receipt is sent to client automatically
   - A **"Send Receipt on WhatsApp"** button appears

---

### Step 10 — Share with Client (Optional)

If the client has a portal account:
1. Go to **Admin → Clients** → add the client account
2. Link their account to this project (via `clientId` field)
3. Client can log in at `/client/login` and see:
   - Project progress and milestones
   - Payment history
   - Documents you've shared (blueprints, estimates, invoices)

---

## Manual Testing Workflows

Use these step-by-step checklists to verify every feature works correctly after deployment.

---

### Test 1 — Admin Login & Basic Navigation

1. Open `https://yoursite.com/admin/login`
2. Enter your admin email and password
3. Expected: Redirected to `/admin` dashboard
4. Verify the sidebar shows: Dashboard, Projects, **Inventory**, Supervisors, Quotes, Clients, Payments, Services, Team, Blog, Enquiries, Settings
5. Click each sidebar item — all pages should load without errors

---

### Test 2 — Seed Initial Data

1. Go to `/admin/seed`
2. Click **"Seed All Sections at Once"**
3. Expected: Green success messages for Company, Services, Projects, Team, Testimonials, Blog
4. Go to `/admin/projects` — should show 6 demo projects
5. Visit public homepage `/` — should show demo data (services, projects, testimonials)

---

### Test 3 — Create a New Project

1. Go to `/admin/projects` → click **Add Project**
2. Fill in: Title, Category (Residential), Status (ongoing), Location, Total Value
3. Upload a cover image
4. Click **Add**
5. Expected: Project appears in the list
6. Click the gear icon → project detail page opens with 9 tabs
7. Go to **Materials** tab → click **Add Default Materials** → 12 materials appear
8. Go to **Team** tab → add a team member (name, role, phone)
9. Go to **Milestones** tab → add 3 milestones
10. Go to **Payments** tab → create a payment request of ₹2,00,000

---

### Test 4 — Supervisor Portal

1. Go to `/admin/supervisors` → click **Add New Supervisor**
2. Fill: Name, Phone, Email (`supervisor@test.com`), Password (`test123`)
3. Select the project you created in Test 3 → click **Create Supervisor Account**
4. Open a new incognito window → go to `/supervisor/login`
5. Log in with `supervisor@test.com` / `test123`
6. Expected: Sees only the assigned project
7. Click the project → go to **Log Entry** tab
8. Select a material (e.g. Sand) → type: **Received** → quantity: 10 → click Submit
9. Expected: Success message, transaction appears in History tab
10. Log another entry: Sand → **Used** → quantity: 12 (more than inward)
11. Expected: Low stock alert email sent to admin + WhatsApp alert button appears
12. Go to **Daily Report** tab → fill in work done, labour count, weather → Submit
13. Back in admin window: Go to `/admin` dashboard → today's report should appear

---

### Test 5 — Client Portal

1. Go to `/admin/clients` → **Add Client** (name, email, phone, Firebase login)
2. Create Firebase user for client at Firebase Console → Authentication → Add User
3. Go to `/admin/projects/[id]` → **Overview** tab → assign client
4. Open incognito → `/client/login` → log in as client
5. Expected: Sees their project, milestones, documents, payment dues
6. Go to admin → project → **Milestones** tab → mark first milestone as **Completed**
7. Expected: Client gets email notification
8. Go to admin → project → **Payments** tab → click **Mark as Paid** on the payment
9. Expected: Status updates to Paid, WhatsApp receipt button appears
10. Click **Send Receipt (WhatsApp)** → WhatsApp opens with pre-filled message

---

### Test 6 — Inventory (Plots & Apartments)

1. Go to `/admin/inventory` → click **Add Project**
2. Fill in: Title (e.g. "Green Valley Plots"), Type (plots), Location, Price From (2500000)
3. Amenities: `DTCP Approved, Gated Community, 24hr Water`
4. Click **Create**
5. Click **Manage** on the new project
6. In **Units Grid** tab → click **Bulk add multiple**
7. Prefix: `Plot-`, Start: 1, Count: 20, Size: 1200, Unit: sqft, Price: 2500000
8. Click **Add 20 Units** → grid shows 20 green cards
9. Click **Plot-3** → modal opens → change status to **Booked** → enter customer name + phone → Save
10. Click **Plot-7** → change to **Sold** → Save
11. Expected: Plot-3 turns amber, Plot-7 turns red
12. Open public site: `https://yoursite.com/plots`
13. Expected: Green Valley Plots appears with "18 Available" badge
14. Click the project → unit grid shows 18 green, 1 amber (Booked), 1 red (Sold)
15. Click any green unit → enquiry form scrolls into view with unit number pre-filled
16. Fill form (name, phone, email) → Submit
17. Expected: Success message shown, admin gets email notification
18. Back in admin → `/admin/inventory/[id]` → **Enquiries** tab → new enquiry appears

---

### Test 7 — Quote Form (Public)

1. Open `https://yoursite.com/quote` in incognito
2. Fill all fields: Name, Phone, Email, Service Type, Location, Budget
3. Click **Submit**
4. Expected: Success message shown
5. In admin: Go to `/admin/enquiries` → new enquiry appears with status **new**
6. Admin should also receive an email notification

---

### Test 8 — Material Low Stock Alert

1. In admin: Go to project → **Materials** tab
2. Note the low stock threshold for Cement (default: 50 bags)
3. Go to **Log Entry** → select Cement → type: Received → quantity: 30 → Submit
4. Go to **Log Entry** → select Cement → type: Consumed → quantity: 28 → Submit
5. Balance = 2 bags (below threshold of 50)
6. Expected: Low stock alert email sent to admin
7. Low stock alert panel appears with **Send Alert (WhatsApp)** button
8. Click the WhatsApp button → WhatsApp opens with alert message

---

### Test 9 — Payment Receipt Flow

1. In admin → `/admin/payments` → find a pending payment
2. Click **Mark as Paid**
3. Expected: Status changes to Paid instantly
4. **Send Receipt (WhatsApp)** button appears — click it
5. WhatsApp opens with a pre-filled receipt message ready to send to client
6. In client portal → `/client/payments` → payment shows as Paid

---

### Test 10 — Public Website Health Check

Open each URL and verify it loads correctly:

| URL | Expected |
|---|---|
| `/` | Homepage with hero, services, projects, stats |
| `/about` | Team, company story |
| `/services` | All 6 services listed |
| `/services/residential-construction` | Service detail with features |
| `/projects` | Project grid with category filter |
| `/projects/4bhk-villa-jubilee-hills` | Project detail page |
| `/plots` | Inventory projects listing |
| `/plots/[your-slug]` | Unit grid with colour-coded availability |
| `/blog` | Blog posts listing |
| `/contact` | Map, phone, WhatsApp |
| `/quote` | Quote form |
| `/client/login` | Client login page |
| `/supervisor/login` | Supervisor login page |

---

### Test 11 — PWA Install (Mobile)

1. Open the live site on a mobile phone (Android Chrome or iOS Safari)
2. Android: Tap the 3-dot menu → **Add to Home Screen**
3. iOS: Tap Share → **Add to Home Screen**
4. Expected: App icon appears on home screen
5. Open from home screen → loads like a native app (no browser bar)

---

### Common Issues & Fixes

| Issue | Likely Cause | Fix |
|---|---|---|
| "Missing or insufficient permissions" | Firestore rules not published | Publish the rules from Section 3 |
| Admin page shows no data | Firebase not configured | Add `.env.local` keys + run `/admin/seed` |
| Emails not sending | SMTP not configured | Add `SMTP_EMAIL`, `SMTP_PASSWORD` to env vars |
| Images not uploading | Firebase Storage rules not set | Publish Storage rules from Section 4 |
| Supervisor can't log in | Account not created correctly | Re-create from Admin → Supervisors |
| "demo-project" in console | `.env.local` missing | Add Firebase keys to `.env.local` / Vercel env vars |

---

## Support

For technical issues, contact **VwebStudio**.

> Last updated: March 2026
