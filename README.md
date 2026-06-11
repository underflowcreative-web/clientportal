# Client Portal — Web Design & Development Agency

A modern, minimalist SaaS-style Client Portal designed for a web design and development agency. Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase** (Auth, Database, Storage, Realtime).

## Features

- **Role-based Authentication**: High-security login with automatic redirection for clients and administrators.
- **Admin Dashboard**: Comprehensive control panel to create client profiles, manage projects, update timelines, approve change requests, and issue invoices.
- **Client Portal Home**: Simplistic card-based layout to access projects, timelines, files, request logs, and bills.
- **Interactive Project Timeline**: Live vertical timeline. Admins can update progress percentages inline, check off milestones, and re-order milestones instantly.
- **Secure File Center**: Private file uploads directly to Supabase storage. Supports downloading assets via short-lived signed URLs.
- **Change Requests**: Easy submission form for clients with instant status tracking and priority tagging.
- **Invoice Tracker**: View outstanding and paid invoices, upload invoice PDFs, and download them securely (no payment gateway integration needed).
- **Supabase Realtime**: Automated UI updates when any record changes in the database.

---

## Technical Stack

- **Framework**: Next.js 15 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Supabase)
- **Auth & Storage**: Supabase Auth & Supabase Storage (Private Buckets)
- **Realtime**: Supabase Realtime Channels

---

## Setup & Local Installation

### 1. Clone or Copy the Repository
Ensure all files are placed in your working folder.

### 2. Configure Supabase Database
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Copy the entire contents of the `supabase-setup.sql` file in this repository and paste it into the SQL Editor.
4. Run the query. This will:
   - Create tables: `profiles`, `projects`, `milestones`, `files`, `change_requests`, and `invoices`.
   - Setup an automatic trigger `on_auth_user_created` to sync auth signups with the `profiles` table.
   - Configure Row Level Security (RLS) policies for all tables.
   - Initialize private storage buckets (`project-files`, `invoices`) with strict access rules.
   - Enable Supabase Realtime for `projects`, `milestones`, `change_requests`, and `invoices`.

### 3. Setup Environment Variables
Create a `.env.local` file in the root folder (or copy `.env.local.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
Replace the values with your project's URL and Anon Key from your Supabase API settings.

### 4. Install Dependencies & Start Server
Install packages and launch the dev server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## Creating the First Admin Account

1. Go to the login page (`/login`) of the local application.
2. Sign up a new user or let an account register. Alternatively, sign up using Supabase dashboard's **Auth** tab.
3. Once the user is registered, retrieve their User UUID from the Supabase dashboard (Auth -> Users).
4. Run the following command in the Supabase SQL Editor to elevate their role to `admin`:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
   ```
5. Log out and log back in. You will now be redirected to the Admin dashboard (`/admin`), where you can add clients, create projects, and manage everything.

---

## Security & Row Level Security (RLS)

All tables have RLS enabled to guarantee data isolation:
- **Clients** can only view records (projects, timelines, change requests, invoices) associated with their user account. They can upload files or submit requests, but only linked to their assigned projects.
- **Admins** have full access to view, update, insert, or delete any record in the system.
- **Storage Buckets** (`project-files` and `invoices`) are private. Users download files using secure, temporary, signed URLs valid for 1 hour.
