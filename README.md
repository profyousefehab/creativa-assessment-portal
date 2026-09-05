# 🏛️ Creativa Assessment Portal

> **Standardized Pre-Test & Post-Test Assessment Platform** for **Creativa Innovation Hub Aswan** (Ministry of Communications and Information Technology - MCIT).

---

## 🌟 Overview

The **Creativa Assessment Portal** is a dual-interface assessment and analytics suite designed for instructors, coordinators, and students at Creativa Innovation Hub Aswan. It streamlines the creation, administration, grading, and auditing of training cohort assessments.

### Key Capabilities
- 👨‍🏫 **Coordinator Portal**:
  - Training cohort and course management with category tagging.
  - Multi-question assessment authoring (Multiple Choice, Single Choice, Open Essay).
  - Live analytics dashboard with cohort performance and completion rates.
  - Manual essay grading suite with rubrics and custom instructor feedback.
  - Full audit trail logging and historical course archiving.
  - Dynamic QR code generation for classroom projection and mobile distribution.
- 🎓 **Student Portal**:
  - Fast QR code or token-based exam entry.
  - Real-time persistent test runner with anti-loss auto-save.
  - Urgency-coded live countdown timers.
  - Full Arabic (RTL) and English bilingual typography.
  - Post-submission confirmation with official review notices.

---

## 🎨 Design & Brand Identity

Built in strict compliance with the Creativa brand design specifications:
- **Primary Brand Color**: Creativa Royal Blue (`#004e9e`), Deep Blue (`#003b78`), Pale Blue Tint (`#e6eff8`).
- **Accent Color**: Creativa Warm Gold (`#f8af43`), Gold Tint (`#fef3e2`).
- **Success Color**: Forest Emerald Green (`#047857` / `#059669`).
- **Typography**:
  - **English / UI**: `Bricolage Grotesque`
  - **Arabic / RTL**: `Thmanyah Sans` (ثمانية) with authentic glyph rendering.
- **Visual Geometry**: Full-pill contours (`rounded-full`), flat paper cards (`rounded-3xl` with hairline `#e5e5e5` borders), and zero generic AI gradients.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Data & Auth**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **Visuals & Charts**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/), [QRCode](https://github.com/soldair/node-qrcode)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### 2. Installation
```bash
git clone https://github.com/profyousefehab/creativa-assessment-portal.git
cd creativa-assessment-portal
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port assigned by Vite) in your browser.

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 🔐 Creating an Admin / Coordinator Account

Once Firebase Authentication Email/Password provider is enabled in your Firebase Console:
```bash
npm run create-admin -- coordinator@creativa.gov.eg YourSecurePassword123!
```

---

## 📄 License

This project is developed for **Creativa Innovation Hub Aswan** — Ministry of Communications and Information Technology (MCIT), Egypt.

