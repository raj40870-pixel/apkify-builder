# 📱 APKify Builder — Web to Android APK Compiler (SaaS)

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**APKify Builder** is a cloud-based SaaS platform that converts Website URLs, raw HTML/CSS/JS, and multi-file ZIP web packages into signed, installable Android APK binaries in under 90 seconds. 

It completely removes the requirement for users to install Android Studio, configure complex Java/Gradle toolchains, or write native Java/Kotlin code.

---

## 🔗 Project Repositories & Live Links

* **🌐 Live Web Application:** [apkify-builder.vercel.app](https://apkify-builder.vercel.app)
* **💻 Frontend Repository:** [apkify-builder](https://github.com/raj40870-pixel/apkify-builder)
* **⚙️ Backend Compiler Repository:** [apk-backend-](https://github.com/raj40870-pixel/apk-backend-)

---

## ✨ Key Features

### 1. 🚀 Triple Input Build Pipeline
* **Website URL:** Transforms any responsive web application or website into an Android app with hardware-accelerated WebViews, offline fallback screens, and pull-to-refresh.
* **ZIP Package:** Supports full multi-page frontend packages (HTML files, CSS stylesheets, JavaScript files, images, and subdirectories).
* **HTML Code Editor:** Integrated in-browser code editor for instant mini-app and web game packaging.

### 2. 🛡️ Instant Client-Side Pre-Flight Archive Inspection
* Built-in `JSZip` client validator checks archives directly in the browser before network transmission.
* Blocks unsupported frameworks (**Flutter**, **React Native**, **Native Android Studio Java/Kotlin**, and **Backend Python/Node/PHP** projects) with instant English alerts.
* Prevents corrupted uploads from entering the queue or freezing build progress indicators.

### 3. 🎁 Smart Freemium Quota & 14-Day Auto-Refill
* Free tier accounts receive **3 APK build credits** upon signup.
* Automated **14-Day Renewal Lifecycle** automatically resets user credits every 14 days without requiring manual support tickets.

### 4. 🗄️ 7-Day Admin Safety Vault & Recovery System
* **Soft Delete:** When a user removes an APK from their dashboard history, it is immediately hidden from their view.
* **Safety Vault:** The compiled APK binary is securely retained in an encrypted 7-day Admin Safety Vault for fraud prevention, policy compliance, and accidental user recovery.
* **1-Click Restore:** Platform administrators can restore accidentally deleted builds back to a user's dashboard with a single click.
* **Auto-Purge Worker:** Background hourly cron worker permanently unlinks expired binary files after the 7-day retention period lapses.

### 5. 👑 Comprehensive Admin Control Center
* Role-Based Access Control (RBAC) protecting the administrative dashboard (`/admin`).
* Live platform telemetry: total builds, user counts, system storage metrics, and compilation failure ratios.
* Full user moderation suite: 24-hour temporary suspensions, permanent account bans, unbans, and manual quota adjustments.
* Direct APK inspection and download capabilities.

---

## 🛠️ Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with Dark Glassmorphism |
| **Icons & Animations** | [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/) |
| **HTTP & Client State** | [Axios](https://axios-http.com/), [JSZip](https://stuk.github.io/jszip/) |
| **Security** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) bot mitigation |

---

## 📂 Project Structure

```text
apkify-builder/
├── public/                 # Static public assets, icons, and banners
├── src/
│   ├── components/         # Reusable UI components (Navbar, Footer, Pricing, etc.)
│   ├── lib/                # API client, Auth handlers, credit system helpers
│   │   ├── api.ts          # Axios client with JWT auto-injection
│   │   ├── auth.ts         # User authentication & token storage
│   │   └── freeCreditSystem.ts # Credit quota and build history API
│   ├── pages/              # Main application pages & routes
│   │   ├── LandingPage.tsx # Public marketing and features showcase
│   │   ├── BuilderPage.tsx # Core 1-click APK compiler interface
│   │   ├── DashboardPage.tsx # User profile, credits & build history
│   │   ├── AdminPage.tsx   # Admin control center & 7-day safety vault
│   │   ├── LoginPage.tsx   # User login & OTP authentication
│   │   └── RegisterPage.tsx# Account creation & email verification
│   ├── App.tsx             # Route definitions and layout wrapper
│   └── main.tsx            # Client entry point
├── server.ts               # Local dev server & SSR/production bundler
├── Dockerfile              # Container definition for cloud deployment
├── package.json            # Dependencies and npm scripts
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 or higher recommended)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### 1. Clone the repository
```bash
git clone https://github.com/raj40870-pixel/apkify-builder.git
cd apkify-builder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```env
VITE_API_URL=http://localhost:10000
```
*(In production, set `VITE_API_URL` to your live Cloud Run or backend API service URL).*

### 4. Run the development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for production
```bash
npm run build
```

---

## 📄 License
This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
