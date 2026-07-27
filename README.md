# 📊 DailyHishab (দৈনিক হিসাব) — Smart Personal & Business Financial Ledger

<div align="center">

![DailyHishab Logo](https://img.shields.io/badge/DailyHishab-Smart_Financial_Ledger-3B82F6?style=for-the-badge&logo=wallet&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8.svg?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Offline First](https://img.shields.io/badge/Offline-100%25_Functional-10B981.svg?style=flat-square&logo=sqlite&logoColor=white)](#)

<p align="center">
  <b>Replace messy paper notebooks (খাতা) and complex accounting software with a sleek, private, zero-latency daily financial ledger.</b>
</p>

</div>

---

## 🌟 Why DailyHishab?

**DailyHishab (দৈনিক হিসাব)** is an intelligent, high-performance financial tracking application crafted for individuals, shopkeepers, traders, freelancers, and small businesses. It combines the tactile simplicity of traditional cash-books with modern web technology—giving you total control over daily cash flow, instant mathematical accuracy, visual financial insights, and secure multi-format report sharing.

Whether you're tracking daily household expenses, managing shop cash-in/cash-out, or archiving client transaction histories, **DailyHishab makes financial bookkeeping effortless, private, and delightful.**

---

## 🔥 Key Features & Capabilities

### ⚡ 1. Ultra-Fast Daily Bookkeeping
* **Dedicated Cash-In (+) & Cash-Out (-) Ledger**: Dedicated screens tailored for rapid entry creation with category tagging, payment methods, note attachments, and timestamps.
* **Instant Calculations**: Automatic real-time recalculation of daily subtotals, cumulative net balance, and entry volume.
* **Smart Categorization & Custom Tags**: Pre-configured with essential categories (Salary, Business, Groceries, Rent, Utilities, Transport, etc.) plus complete freedom to add custom tags.

### 📊 2. Visual Analytics & Financial Reports
* **Interactive Recharts Graphs**: View income vs. expense trends over daily, monthly, and annual timeframes with fluid bar charts.
* **Category Breakdown Charts**: Analyze spending patterns through intuitive donut and pie charts to identify cash leaks.
* **Advanced Filter Engine**: Search and filter ledger history by exact date ranges, categories, keywords, tags, or min/max amount thresholds.

### 📤 3. Multi-Format Exporting & One-Click Sharing
* **WhatsApp & Social Media JPG Summaries**: High-DPI canvas engine (`html2canvas`) renders beautifully formatted image statements for direct sharing to WhatsApp, Messenger, or email.
* **Excel (.XLSX) Worksheets**: Export clean, structured spreadsheet statements complete with formulas, dates, and itemized entry logs.
* **Print-Ready PDF Reports**: Generate styled, client-ready PDF financial statements for accounting records or tax filing.

### 📅 4. Localized Date Navigation (`DD-MM-YYYY` & Day Names)
* **Express Navigation Bar**: Seamlessly switch between *Yesterday*, *Today*, *Tomorrow*, or select any custom calendar date via an interactive modal picker.
* **Bilingual Date Display**: Fully formats dates in standard `DD-MM-YYYY (Weekday)` format in both English (e.g. `27-07-2026 (Monday)`) and Bengali (e.g. `২৭-০৭-২০২৬ (সোমবার)`).

### 🌐 5. Complete Bilingual (English & বাংলা) & Currency Flexibility
* **Native English & Bengali (বাংলা) Localization**: Complete interface translation including full support for Bengali numerals (`১, ২, ৩, ৪...`).
* **Custom Currency Selector**: Toggle between local currencies (৳ BDT, ₹ INR, $ USD, € EUR, £ GBP, or custom symbols) with configurable formatting.

### 🔐 6. App Lock PIN Security & Privacy Shield
* **4-Digit Security PIN**: Safeguard sensitive financial records with salted hashed PIN authentication and automatic inactivity auto-lock.
* **One-Tap Privacy Masking**: Hide account balances and cash totals with an eye-icon toggle for safe usage in public places.

### 💾 7. 100% Offline-First & Google Drive Sync
* **Zero-Latency LocalStorage Architecture**: Operates 100% offline without requiring internet access or server authentication.
* **JSON Backup & Restore**: One-click data download and restoration to ensure zero data loss when switching devices.
* **Google Drive Integration**: Direct cloud backup capability for encrypted remote sync.

### 📱 8. Progressive Web App (PWA) & Modern Glassmorphism Design
* **Installable App Experience**: Add DailyHishab directly to your iOS / Android home screen or Desktop for a native app feel.
* **Fluid Dark & Light Themes**: Carefully selected color palettes (Light, Dark, and System Auto) featuring glassmorphism accents and responsive mobile tab bars.

---

## ⚡ Comparison: DailyHishab vs. Alternatives

| Feature | Paper Notebook (খাতা) | Complex Accounting Apps | DailyHishab 📊 |
| :--- | :---: | :---: | :---: |
| **Setup Time** | Instant | Hours of configuration | **0 Seconds** |
| **Offline Support** | Yes | Often requires login/cloud | **100% Offline-First** |
| **Automated Totals** | ❌ Manual calculation | Yes | **Instant Real-Time** |
| **WhatsApp Image Export** | ❌ Take photos | ❌ Rare | **One-Tap HD Render** |
| **Excel & PDF Statements** | ❌ Impossible | Paid feature | **Free & Built-in** |
| **Privacy & Security** | ❌ Easily misplaced | Data sent to servers | **Local Storage & PIN** |
| **Bengali Numeral Support** | Manual | ❌ English only | **Full `১, ২, ৩` Support** |

---

## 🛠️ Technology Stack

```
Frontend Architecture
├── React 19          # Modern UI library with concurrent rendering
├── TypeScript 5.8    # Strict type safety and clear schema definitions
├── Tailwind CSS v4   # High-performance utility styling & responsive design
├── Motion (Framer)   # Smooth route transitions and micro-interactions
└── Lucide React      # Clean, accessible vector icons

Data & Storage Layer
├── LocalStorage API  # Instant client-side persistence
├── Express Server    # Node.js backend proxy for server-side services
└── Google GenAI SDK  # Optional smart financial insights proxy

Data Visualization & Export
├── Recharts          # SVG visual analytics and comparison charts
├── html2canvas       # High-DPI canvas rendering for JPG statement shares
├── jspdf             # Vector PDF document generation
└── xlsx (SheetJS)    # Native Excel spreadsheet compilation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/daily-hishab.git
cd daily-hishab
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### 4️⃣ Production Build & Execution
```bash
# Build Vite client and bundle ESBuild Express server
npm run build

# Launch production server
npm start
```

---

## 📁 Directory Architecture

```
daily-hishab/
├── src/
│   ├── components/
│   │   ├── accounts/          # Advanced search, time filters, statement exports & notes
│   │   ├── analytics/         # Recharts visual dashboards & category breakdown charts
│   │   ├── auth/              # Lock screen & PIN setup modals
│   │   ├── brand/             # Responsive logo & branding elements
│   │   ├── entries/           # Income (+), Expense (-) tables & quick entry rows
│   │   ├── layout/            # Main layout wrapper, header bar & mobile bottom navigation
│   │   ├── settings/          # Currency, theme, language, brand, PIN & Google Drive sync
│   │   └── shared/            # Date selector, calendar popups & date navigator
│   ├── context/               # Global React AppContext state & offline handling
│   ├── i18n/                  # English & Bengali translation dictionaries
│   ├── pages/                 # EntryPlus, EntryMinus, Accounts, & Settings pages
│   ├── styles/                # Tailwind v4 imports & glassmorphism custom CSS
│   ├── types/                 # TypeScript interfaces (Entry, UserProfile, Categories)
│   └── utils/                 # Date helpers (DD-MM-YYYY), export engine & storage API
├── server.ts                  # Express server entry point & API route proxy
├── index.html                 # PWA HTML shell & metadata
├── package.json               # App manifest & npm scripts
└── README.md                  # Application documentation
```

---

## 🎯 Use Cases

* **🏬 Retail & Shopkeepers (দোকানদার)**: Track daily sales, cash balances, supplier expenses, and generate instant WhatsApp receipt summaries for customers.
* **💼 Freelancers & Consultants**: Log project income, keep track of software subscriptions, and export monthly itemized Excel reports for tax filing.
* **🏠 Household & Personal Budgeting**: Maintain family expense ledgers, categorize grocery/rent costs, and analyze monthly savings trends.
* **🚕 Small Service Businesses**: Keep track of daily operational expenses, fuel costs, and driver allowances with clean PDF downloads.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

**Made with ❤️ for simple, clear, and secure daily financial management.**

[⭐ Star on GitHub](https://github.com/your-username/daily-hishab) • [🐛 Report Bug](https://github.com/your-username/daily-hishab/issues) • [💡 Request Feature](https://github.com/your-username/daily-hishab/issues)

</div>
