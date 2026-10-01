# VeriScale 📈
> **Growth + Trust Blends** — A modern, high-performance Sales, Analytics, and Inventory Management Dashboard built for scaling businesses.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## 🌟 Overview

**VeriScale** is a streamlined business management platform designed to track sales transactions, monitor profit margins, and manage inventory operations seamlessly. Powered by Next.js 16 (App Router), React 19, Tailwind CSS v4, and Supabase, VeriScale delivers an intuitive, fast, and visually refined experience.

---

## ✨ Features

- **📊 Sales & Analytics Dashboard**: Real-time sales transactions tracking, automated revenue and profit calculation.
- **⚡ Quick Transaction Recording**: Intuitive form to log sales transactions including item name, unit price, cost price, quantity, and date.
- **🔐 Secure Authentication**: Full user authentication suite (Sign In, Sign Up, Session Persistence, Secure Logout) powered by Supabase Auth.
- **🎨 Modern Glassmorphic Interface**: Responsive layout featuring smooth transitions, collapsible navigation sidebar, and custom branded aesthetics.
- **🛡️ Row Level Security (RLS)**: Enterprise-grade database security with granular policy management via Supabase.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile workflows.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Frontend Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- **Fonts**: [Geist Sans & Geist Mono](https://vercel.com/font)

---

## 📁 Project Structure

```text
├── app/
│   ├── coming-soon/      # Placeholder for upcoming modules (Suppliers, Reports, etc.)
│   ├── login/            # Authentication login screen
│   ├── signup/           # User registration screen
│   ├── favicon.ico       # Custom VeriScale favicon
│   ├── icon.svg          # Modern SVG brand icon
│   ├── globals.css       # Global styles & Tailwind CSS v4 directives
│   ├── layout.tsx        # Root layout with fonts, metadata, and icon links
│   └── page.tsx          # Main dashboard entry point
├── components/
│   ├── dashboard.tsx     # Primary sales metrics and transaction tracker
│   ├── leftbar.tsx       # Collapsible sidebar navigation drawer
│   ├── navbar.tsx        # Top navigation header with search and auth actions
│   └── rightbox.tsx      # Main content container
├── libs/
│   └── supabase.ts       # Supabase client initialization
├── types/
│   └── index.ts          # Core TypeScript type definitions
└── public/               # Static assets & icons
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18.18 or later recommended)
- `npm`, `pnpm`, or `yarn`
- A [Supabase](https://supabase.com/) account and project

### 1. Clone the Repository

```bash
git clone https://github.com/codekid-cyber1/VeriScale.git
cd VeriScale
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Database Schema

Run the full schema located at [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor. It sets up `products`, `product_variants`, `transactions`, and strict Row Level Security (RLS) policies:

```sql
-- See supabase/schema.sql for the complete script with RLS & indexes.
-- Supports master stock, multi-unit portions (Bag, 1/2 Bag, etc.), and sales transactions.
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Compiles the production build |
| `npm run start` | Runs the built application in production mode |
| `npm run lint` | Runs ESLint to check for code quality issues |

---

## 🗺️ Roadmap

- [x] Sales overview and transaction logging
- [x] Supabase authentication (Login & Signup)
- [x] Collapsible sidebar navigation
- [ ] Stock & inventory management
- [ ] Supplier orders & logistics tracking
- [ ] Export reports (CSV, PDF)
- [ ] Multi-currency support

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve VeriScale:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
