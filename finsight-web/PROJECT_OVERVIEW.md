# FinSight AI: Project Overview

## 1. Executive Summary
**FinSight AI** is a sophisticated, intelligent personal finance management application designed for the modern user. It moves beyond simple bookkeeping by integrating **Generative AI (Google Gemini)** to provide deep, actionable insights into spending habits and long-term wealth accumulation. The application features a minimalist, high-contrast design philosophy that prioritizes clarity, efficiency, and professional aesthetics.

---

## 2. Core Value Propositions
*   **Unified Financial Visibility**: A single "Source of Truth" for liquid balance (daily transactions) and illiquid assets (stocks, crypto, real estate).
*   **AI-Driven Strategy**: Utilizes the Gemini 3 Flash model to analyze raw transaction data and generate personalized financial advice.
*   **Asset Performance Tracking**: Dynamic portfolio management that allows users to track cost basis vs. current market value to visualize ROI.
*   **Secure & Private Experience**: A dedicated authentication module (Login/Register) ensuring personal data is localized and protected within the user session.

---

## 3. Key Feature Modules

### A. Authentication & User Management
A secure gateway for users to manage their financial identity.
*   **Modular Screens**: Sleek transitions between Login and Registration.
*   **Identity Branding**: Personalized greetings and profile summaries within the dashboard.

### B. Intelligent Dashboard
The cockpit of the financial experience.
*   **Net Worth Engine**: Real-time calculation of total wealth (Cash + Assets).
*   **Cash Flow Visualization**: Interactive Bar Charts tracking the last 10 entries to identify spending spikes.
*   **Allocation Analytics**: Pie charts visualizing the distribution of investments and expense categories.

### C. Asset Portfolio Manager
A dedicated module for long-term wealth building.
*   **Multi-Asset Support**: Track diverse categories including Stocks, Crypto, and Real Estate.
*   **Live Rate Updates**: Manual refresh capability to adjust "Current Market Price" and instantly see updated gains/losses.
*   **Performance Badging**: Visual indicators (percentage gains/losses) with directional icons.

### D. Smart Transactions
Effortless logging of daily financial life.
*   **Categorization**: Automatic categorization of income and expenses.
*   **History Table**: A high-density data view for auditing past financial behavior.

---

## 4. Technical Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (Vite) | Core application logic and component structure. |
| **Styling** | Tailwind CSS | Utility-first styling for a responsive, "Pro" UI look. |
| **Intelligence** | Gemini 3 Flash (Google GenAI) | Natural language analysis of financial data. |
| **Data Visualization** | Recharts | Performant, SVG-based financial charting. |
| **Icons** | Lucide React | Minimalist, consistent iconography. |
| **Type Safety** | TypeScript | Robust data modeling for transactions and assets. |

---

## 5. User Interface (UI) Design Philosophy
*   **Minimalism**: Use of white space and "Slate" tones to reduce cognitive load.
*   **Feedback Loops**: Use of "Emerald" (Success) and "Rose" (Warning) to provide instant emotional context to financial data.
*   **Mobile-First**: Fully responsive sidebar and layout that adapts seamlessly from desktop workstations to mobile devices.
*   **Aesthetics**: Glassmorphism effects on modals and high-density typography for a premium financial tool feel.

---

## 6. Future Roadmap
*   **Automatic Market Feeds**: Integration of real-time stock/crypto price APIs.
*   **Predictive Budgeting**: AI-generated monthly budgets based on historical trends.
*   **Export Controls**: Generating PDF/CSV monthly financial health reports.
*   **Goal Tracking**: Milestone visualization for specific saving targets (e.g., "New House Fund").
