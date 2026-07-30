# 📊 DailyHishab (দৈনিক হিসাব) — Smart Financial Ledger & Cash Book

<div align="center">

![DailyHishab Banner](https://img.shields.io/badge/DailyHishab-Smart_Financial_Ledger-3B82F6?style=for-the-badge&logo=wallet&logoColor=white)

[![Hosted Live](https://img.shields.io/badge/Hosted_Live-Cloud_Run-3B82F6.svg?style=for-the-badge&logo=googlecloud&logoColor=white)](https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app)
[![1-Tap Install & Shortcut](https://img.shields.io/badge/1--Tap_Install-Add_Shortcut_to_Home_Screen-10B981.svg?style=for-the-badge&logo=android&logoColor=white)](#-1-tap-install--add-shortcut-to-home-screen)
[![Multi-Device Cloud Sync](https://img.shields.io/badge/Cloud_Sync-Instant_Multi--Device-6366F1.svg?style=for-the-badge&logo=firebase&logoColor=white)](#-real-time-multi-device-cloud-vault-sync)
[![100% Offline First](https://img.shields.io/badge/Offline-100%25_Functional-10B981.svg?style=for-the-badge&logo=sqlite&logoColor=white)](#-100-offline-first--privacy)
[![Firebase Cloud Vault](https://img.shields.io/badge/Cloud_Vault-Firebase_Firestore-FFCA28.svg?style=for-the-badge&logo=firebase&logoColor=black)](#-firebase-cloud-vault--master-recovery-key)
[![Bilingual EN/BN](https://img.shields.io/badge/Language-English_%7C_%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE-FF6B6B.svg?style=for-the-badge)](#-bilingual-english--বাংলা-flexibility)

<br/>

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      DailyHishab (দৈনিক হিসাব)                         │
 │      Simple yet Feature-Rich • Classic yet Modern • Offline-First     │
 ├────────────────────────────────────────────────────────────────────────┤
 │ [💵 Daily Ledger]  [📋 Monthly Summary]  [📊 Analytics]  [📤 Export]  │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 📲 [1-Tap Install & Add App Shortcut directly to Home Screen]          │
 │ 🔄 [Instant Multi-Device Sync • Live Online Status & Manual Cloud Sync]│
 └────────────────────────────────────────────────────────────────────────┘
```

<p align="center">
  <b>Simple yet feature-rich • Contemporary yet future-proof • Classic yet modern • Appropriate yet customizable</b><br/>
  <i>Replace messy paper notebooks (হিসাবের খাতা) and heavy accounting tools with a zero-latency, elegant daily financial ledger. Designed for personal budgeting, small business cash flow, and instant multi-device cloud synchronization across phone, tablet, and PC.</i>
</p>

### 🚀 [**Click Here to Open DailyHishab Live App & Add Home Screen Shortcut**](https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app)
*(Works 100% offline • Instant Multi-Device Cloud Sync • Firebase Encrypted Vault • PWA Installable)*

</div>

---

## 🔥 What's New in the Latest Update

* 🔄 **Seamless Multi-Device Cloud Vault Sync**: Entries made on a phone (or any device) under a specific Vault ID / User ID automatically merge and synchronize instantly to all logged-in devices (e.g., Windows PC, mobile browser, tablet) without losing any historical data.
* 🌐 **Real-Time Network Status Indicator**: Live header badge with pulsing state indicator gives instant visual feedback on internet connection status (`Online` vs `Offline Mode`).
* ⚡ **Dedicated Manual Cloud-Sync Button**: One-tap manual sync button with spinning feedback indicator and toast notification banner lets users trigger on-demand synchronization anytime.
* 🛡️ **Zero-Loss Non-Destructive Data Merging**: Intelligent conflict-free merging (`mergeEntries` & `mergeNotes`) preserves entry timestamps, guaranteeing zero data loss across concurrent devices.
* 📦 **IndexedDB Offline Fallback Sync**: Dual-tier client storage syncs local storage with browser IndexedDB, ensuring complete protection against accidental browser cache evictions.
* ☀️ **High-Contrast Light Theme & Legibility Refresh**: High-contrast typography (`slate-900`), high-visibility labels, and slate-50/100 cards for maximum readability under any lighting.
* 🔒 **Enhanced Multi-Option Account Recovery**: 3 distinct ways to recover lost PINs and cloud vaults—16-character Master Recovery Key (`DH-XXXX-XXXX-XXXX`), JSON backup file restore, or trusted local device restoration.
* 🏷️ **Customizable Navigation Bar Labels**: Personalize tab names (Ledger, Summary, Analytics, Settings) to suit individual preferences or Bengali localization needs.

---

## 🔄 Real-Time Multi-Device Cloud Vault Sync

DailyHishab provides a robust multi-device cloud synchronization engine linked to your **Vault ID / 11-Digit User ID** and **4-Digit PIN**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     DAILYHISHAB CLOUD VAULT ENGINE                          │
 ├─────────────────────────┬─────────────────────────┬─────────────────────────┤
 │ 📱 Mobile App (Phone)   │ ☁️ Firebase Cloud Vault │ 💻 Desktop PC (Windows) │
 │ [Logs yesterday entry] ➔│ [Smart Non-Destructive] │➔[Instantly sees entries]│
 │                         │  [Timestamp Merging]    │                         │
 └─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### 🌟 How Multi-Device Sync Works:
1. **Unified Vault Identifier**: Logging into the same **User ID** (e.g. `01346592831`) and **PIN** on any device connects to your shared cloud vault.
2. **Instant Sync Triggers**: Auto-sync executes seamlessly when opening the app, switching tabs, restoring internet connection, or every 20 seconds in the background.
3. **Smart Timestamp Merging**: If entries are created offline on multiple devices, the non-destructive merging algorithm safely combines all transactions without overwriting existing data.
4. **Manual Sync On-Demand**: Tap the **"Cloud Sync / ক্লাউড সিঙ্ক"** button in the top navigation bar for instant forced synchronization with real-time feedback toast notifications.

---

## 📲 1-Tap Install & Add Shortcut to Home Screen

DailyHishab features a built-in **1-Tap Direct Install & Add Shortcut** engine accessible right inside the **App Settings** page and directly from the web browser:

```
┌─────────────────────────────────────────────────────────────────────────────┐
 │ 📲 Install & Add Shortcut to Home Screen                    [⚡ 1-Tap Access]│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ Access DailyHishab in 1-tap directly from your phone's home screen or PC   │
 │                                                                             │
 │ [ 🚀 Add Shortcut / Install App ]  <-- (Tap directly in App Settings)      │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 🤖 Android Chrome  : Tap "Add Shortcut" above or 3-dots (⋮) ➔ Add to Home  │
 │ 🍏 iPhone Safari   : Tap Share (↑) ➔ Scroll down & tap Add to Home Screen   │
 │ 💻 PC Desktop      : Click Install Icon (🖥️ / ➕) in browser address bar     │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 🌟 Why Add DailyHishab to Your Home Screen?
* **Zero Browser Hassle**: No need to open your browser, search history, or re-type URLs every day.
* **Instant Launcher Icon**: Appears with custom brand icon directly on your smartphone app drawer/home screen.
* **Full-Screen App Mode**: Opens in dedicated windowed application view without browser address bars.
* **100% Offline Launch**: Works instantly even when mobile data or Wi-Fi is turned off.

---

## 🌟 Why Choose DailyHishab?

> *"Designed to feel as natural as writing in a physical cash book, yet powered by modern cloud database security, visual charts, multi-device cloud sync, 1-tap home screen shortcuts, custom dropdown managers, and dual-engine statement exports."*

* **🔄 Instant Multi-Device Sync**: Access your ledger from phone, tablet, or desktop with real-time non-destructive cloud synchronization.
* **🌐 Live Network Status Indicator**: Instant visual feedback showing online/offline status in the header.
* **⚡ One-Tap Manual Cloud Sync**: Force immediate vault synchronization anytime with full status toasts.
* **📱 1-Tap Home Screen Shortcut**: Tap **"Add Shortcut / Install App"** in App Settings to place DailyHishab directly on your phone's home screen.
* **🔒 Firebase Secure Cloud Vault**: Cloud backups locked by your 11-digit User ID (Phone Number) and 4-digit PIN.
* **🔑 16-Character Master Security Recovery Key**: Zero-knowledge vault protection (`DH-XXXX-XXXX-XXXX`) ensures account recovery even if PIN is forgotten.
* **📱 100% Offline First + IndexedDB**: Works seamlessly without internet access with zero data-loss caching.
* **📤 WhatsApp Statement Studio**: Generate high-resolution JPG summary cards with 1 tap for instant WhatsApp & Messenger sharing.
* **🌐 Native Bilingual English & Bengali (বাংলা)**: Complete UI localization with seamless Bengali numeral (`১, ২, ৩, ৪...`) support.
* **⚙️ Complete Personalization**: Custom categories, payment modes, navigation labels, and multi-currency formats (৳, ₹, $, €, £).

---

## 📸 App Architecture & Navigation Layout

DailyHishab provides an intuitive workspace with fluid tab navigation and live header feedback:

```
┌─────────────────────────────────────────────────────────────────────────────┐
 │ 📅 Thursday, 30 July 2026      [🟢 Online] [🔄 Cloud Sync] [🔒 Lock PIN]   │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │  💵 TODAY'S INCOME       💸 TODAY'S EXPENSE      ⚖️ CUMULATIVE NET BALANCE │
 │     ৳ 25,000.00             ৳ 8,450.00               ৳ 16,550.00           │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 📂 Ledger Views: [💵 Daily Ledger] [📋 Monthly Summary] [📊 Visual Analytics]│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 📲 HOME SCREEN SHORTCUT: [ 🚀 Add Shortcut / Install App ]                   │
 │ 🔄 CLOUD VAULT SYNC   : [ ⚡ Sync Vault Now (Device Sync Active) ]           │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │  📋 MONTHLY EXECUTIVE SUMMARY (JULY 2026)                                   │
 │  • Total Income: ৳ 145,000.00  | Total Expense: ৳ 48,200.00                │
 │  • Net Surplus:  ৳  96,800.00  | Savings Rate:  66.8%                     │
 │  • Health Score: 92/100 (Excellent Surplus Reserve)                       │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 🔑 Master Security Recovery Key: [ DH-8A92-4F10-99E1 ] [Copy Key]           │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 📤 Statement Studio: [WhatsApp JPG Card] [Excel .XLSX] [Print-Ready PDF]    │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features & Highlights

### 🔄 1. Multi-Device Continuous Cloud Vault Sync
* **Cross-Device Ledger**: Logs added on mobile appear on desktop PC instantly upon connection.
* **Conflict-Free Merging**: Intelligently merges entries across devices based on unique transaction IDs and update timestamps.
* **Automatic Background Poll**: Keeps open sessions continuously synchronized every 20 seconds.
* **Visibility & Focus Sync**: Automatically syncs whenever you switch back to the application tab.

### 🌐 2. Live Network Status & Manual Cloud Sync
* **Pulsing Network Indicator**: Live indicator dot in the header showing active online (`bg-emerald-500`) or offline state (`bg-amber-500`).
* **Dedicated Cloud Sync Button**: Dedicated button in the header bar with rotating animation during sync operations.
* **Toast Feedback Banners**: Instant user notifications confirming sync completion or offline status.

### ☀️ 3. Refined High-Contrast Interface & High Legibility
* **Crisp Typography**: Dark high-contrast text (`slate-900`) over clean light backgrounds for optimum sunlight and indoor readability.
* **High Contrast Forms**: Distinct inputs, bold labels, explicit focus rings, and clear validation feedback.
* **Balance Visibility Toggle**: Easily hide sensitive financial figures with a single tap on the top bar.

### 📲 4. Direct 1-Tap Install & Add Home Screen Shortcut
* **Direct App Settings Integration**: Tap the glowing **"Add Shortcut / Install App"** button inside Settings for instant installation.
* **Native PWA Prompt Engine**: Uses web standard `beforeinstallprompt` API to launch native installation dialogs.
* **Device-Aware Manual Guides**: Interactive step-by-step guidance for iOS Safari, Android Chrome, and Desktop PC.

### 💵 5. Rapid Cash-In (+) & Cash-Out (-) Ledger
* **Streamlined Entry**: Log income and expenses in seconds with custom categories, payment modes (Cash, Bkash, Nagad, Card, Bank), and notes.
* **Dynamic Totals**: Subtotals and net balances recalculate instantly without page reloads.
* **One-Tap Actions**: Easily duplicate, edit, or remove entries with full undo history.

### 📋 6. Monthly Executive Summary Dashboard
* **Comprehensive Metrics**: View total income, total expenses, net surplus/deficit, savings rate, and expense-to-income ratios.
* **Automated Narrative**: Generates human-readable financial insights in English and Bengali.
* **Month-over-Month (MoM) Variance**: Side-by-side performance comparison against previous months.

### 🩺 7. Financial Health Scorecard (0–100)
* **Smart Evaluation**: Assesses cash flow stability, reserve strength, and spending patterns.
* **Actionable Guidance**: Receives real-time tips on budget allocation and expense reduction.

### 📊 8. Interactive Recharts Analytics & Search
* **Visual Cash Flow Charts**: Interactive bar and area charts for daily, monthly, and yearly cash flow.
* **Category Donut Breakdown**: Pinpoint top spending categories effortlessly.
* **Multi-Filter Search**: Filter transactions by keywords, date ranges, categories, or payment methods.

### 🔐 9. Firebase Cloud Vault & Multi-Method Recovery
* **Individual Cloud Storage**: Backups stored securely in Firebase Firestore (`user_backups/{userId}`).
* **PIN Authorization**: Protected by salted 4-digit PIN authentication.
* **16-Character Master Recovery Key**: Auto-assigned `DH-XXXX-XXXX-XXXX` master key enables zero-knowledge account recovery if PIN is lost.
* **3 Recovery Pathways**: Recover via Master Recovery Key, JSON backup upload, or trusted local device restoration.

### 📤 10. Dual-Engine Statement Studio & WhatsApp Sharing
* **WhatsApp JPG Image Cards**: Generate styled summary images for direct sharing on WhatsApp, Messenger, or Email.
* **Excel (.XLSX) Worksheets**: Export itemized spreadsheets with headers and totals.
* **Print-Ready PDF Reports**: Download formatted PDF financial statements ideal for physical archiving.

---

## 📱 Quick Setup & Installation Guide

DailyHishab is a **Progressive Web App (PWA)** that can be installed on any smartphone, tablet, or desktop computer in under 1 minute.

### 🚀 Live App URL
* **Live App:** [https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app](https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app)

### 📱 Installation Steps (1-Tap & Manual)
| Platform | Direct 1-Tap Option | Manual Step Instructions |
| :--- | :--- | :--- |
| **📱 In-App Settings (All Platforms)** | **Tap "Add Shortcut / Install App"** inside App Settings | Triggers native installation dialog automatically. |
| **🤖 Android (Chrome)** | **Direct 1-Tap Web Prompt** | Open URL ➔ Tap **3 dots (⋮)** ➔ Select **"Add to Home Screen"** or **"Install App"**. |
| **🍏 iPhone / iPad (Safari)** | **1-Tap Share Sheet Guide** | Open URL in Safari ➔ Tap **Share Button (↑)** ➔ Scroll down & select **"Add to Home Screen"**. |
| **💻 Desktop (Chrome/Edge)** | **Direct Desktop App Install** | Open URL ➔ Click the **Install Icon (🖥️ / ➕)** in browser address bar. |

---

## ⚡ Capability Comparison

| Feature | Paper Notebook (খাতা) | Generic Spreadsheet | DailyHishab 📊 |
| :--- | :---: | :---: | :---: |
| **Multi-Device Live Sync** | N/A | Manual file sync | **Instant & Automated Cloud Vault** |
| **Network Status Indicator**| N/A | N/A | **Live Header Badge & Toasts** |
| **Home Screen Shortcut** | N/A | Manual bookmarking | **1-Tap Direct Install** |
| **High-Contrast Readability** | Variable handwriting | Plain grid | **Optimized Light/Dark Modes** |
| **Setup Time** | Instant | 15+ minutes | **0 Seconds (Direct Link)** |
| **Offline Operation** | Physical book required | Limited | **100% Offline First + IndexedDB** |
| **Calculations** | Manual & error-prone | Requires formulas | **Instant & Automated** |
| **WhatsApp JPG Sharing** | Phone camera photo | Not available | **1-Tap HD Image Card** |
| **Cloud Sync & Recovery** | Lost if misplaced | Manual file saving | **Firebase Phone + PIN Restore** |
| **Master Security Recovery Key**| N/A | N/A | **16-Char Master Key (`DH-XXXX`)** |

---

## 🛠️ Technology Stack

```
Frontend Core
├── React 18 + Vite       # High-performance component architecture
├── TypeScript            # Strict type safety across ledger models
├── Tailwind CSS          # Responsive, high-contrast modern UI styling
├── Motion (Framer)       # Smooth view animations & modal transitions
└── Lucide React          # Vector icons

PWA & Shortcut Engine
├── Web Manifest         # Native app metadata, icons, and display mode
├── Service Worker (sw.js)# Offline asset caching & instant launcher support
└── beforeinstallprompt  # Native 1-tap browser prompt integration

Backend & Persistence
├── Firebase Firestore    # Encrypted Cloud Backup Vault & Multi-Device Sync
├── LocalStorage + IDB    # Zero-loss local device persistence engine
└── Web Crypto API        # Salted PIN hashing & security verification

Export Studio
├── html-to-image         # SVG canvas rendering for HD JPG cards
├── html2canvas           # Multi-browser fallback canvas engine
├── jspdf                 # Client-side PDF generator
└── xlsx (SheetJS)        # Excel spreadsheet builder
```

---

## 💻 Local Development Setup

To run or customize DailyHishab locally on your machine:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/daily-hishab.git
cd daily-hishab

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

**Crafted with ❤️ for fast, private, smart financial tracking across all your devices.**

[🚀 Open Live App & Add Shortcut](https://ais-pre-43fuxb4i4jesdkqxrh5td2-1074731241775.asia-southeast1.run.app) • [⭐ Star on GitHub](https://github.com/your-username/daily-hishab) • [🐛 Report Bug](https://github.com/your-username/daily-hishab/issues)

</div>
