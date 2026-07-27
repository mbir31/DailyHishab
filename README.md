# 📊 DailyHishab (দৈনিক হিসাব) — Smart Personal & Business Financial Ledger

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)

**DailyHishab** is an elegant, lightning-fast, and secure personal & small-business financial ledger web application. Designed for effortless daily cash-in (Income) and cash-out (Expense) tracking, DailyHishab combines offline-first privacy with high-resolution statement sharing via WhatsApp, Excel/PDF exports, visual analytics, PIN security, and full bilingual support (English & Bengali).

---

## ✨ Key Features & Highlights

### ⚡ 1. Effortless Daily Bookkeeping
* **Dual Cash-Flow Ledger**: Dedicated Entry (+) and Entry (-) tabs for quick logging of daily income and expenses.
* **Instant Calculations**: Real-time auto-summing of daily totals, cumulative net balances, and itemized entry counts.
* **Smart Tagging & Categorization**: Organize transactions with default or custom categories (Salary, Business, Groceries, Rent, Utilities, etc.) and custom tags.

### 📅 2. Localized Date Navigation (`DD-MM-YYYY` & Day Names)
* **Custom Date Selector**: Quickly jump between *Yesterday*, *Today*, *Tomorrow*, or any custom calendar date.
* **Clear Date & Day Format**: Displays date in standard `DD-MM-YYYY (Weekday)` format (e.g. `27-07-2026 (Monday)` or `২৭-০৭-২০২৬ (সোমবার)`) across all views, search logs, and exported statements.

### 📤 3. One-Click Image & Statement Exporting
* **WhatsApp & Social Media Image Sharing**: Render and share high-DPI JPG statement summaries directly to WhatsApp or native device share drawers.
* **Excel (.XLSX) Export**: Export full itemized ledger statements complete with summary rows and formulas.
* **Printable PDF Reports**: Download cleanly formatted PDF financial reports for personal archiving or business accounting.

### 📈 4. Visual Financial Analytics & Reports
* **Monthly & Annual Comparison**: Interactive Recharts bar graphs contrasting Cash-In vs. Cash-Out trends.
* **Category Distribution**: Pie charts highlighting top expense and income categories.
* **Advanced Search & Filtering**: Filter transactions by custom date range, category, keyword, tags, or min/max amount.

### 🌐 5. Bilingual & Multi-Currency Support
* **Full Bengali & English Localization**: Complete UI localization in English and Bengali (বাংলা), including Bengali numerals (`১, ২, ৩...`).
* **Custom Currency Symbols**: Choose your preferred currency symbol (৳ BDT, ₹ INR, $ USD, € EUR, £ GBP, etc.).

### 🔒 6. App Lock PIN Security & Privacy
* **PIN Protection**: Protect financial records with a 4-digit security PIN and optional auto-lock inactivity timer.
* **Privacy Masking**: One-tap toggle to mask sensitive financial amounts when viewing in public settings.

### 💾 7. Offline-First & Cloud Sync
* **Zero-Latency Offline Mode**: Works completely offline with automatic browser LocalStorage persistence.
* **Backup & Restore**: Easily download encrypted JSON data backups or restore previous ledger states.
* **Google Drive Sync Ready**: Built-in Google Drive API backup integration.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons, Glassmorphism UI |
| **State Management** | React Context API with persistent LocalStorage layer |
| **Data Visualization** | Recharts Data Visualization Library |
| **Export Engines** | `html2canvas` (JPG rendering), `xlsx` (Excel), `jspdf` (PDF) |
| **Build & Tooling** | Vite, Express (Node.js runtime server), ESBuild |

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/daily-hishab.git
cd daily-hishab
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Step 4: Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```
daily-hishab/
├── src/
│   ├── components/
│   │   ├── accounts/          # Statement export, analytics, search & time filters
│   │   ├── analytics/         # Visual charts, category breakdowns & yearly trends
│   │   ├── entries/           # Daily income/expense row tables & quick inputs
│   │   ├── layout/            # Navigation header, mobile tab bar & lock screens
│   │   ├── settings/          # Currency, language, profile, PIN & backup controls
│   │   └── shared/            # Date selector & calendar modal popups
│   ├── context/               # Global App Context & state provider
│   ├── types/                 # TypeScript type definitions for entries & user profiles
│   ├── utils/                 # Date helpers (DD-MM-YYYY), export services & storage APIs
│   ├── App.tsx                # Main view router & tab navigation
│   └── main.tsx               # App entry point
├── package.json               # Project manifest & npm scripts
└── README.md                  # Documentation
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p center>
  Crafted with ❤️ for simple, clear, and secure daily financial management.
</p>
