# 🇮🇳 Smart Bharat - Civic Engagement Platform

Smart Bharat is an AI-powered, multilingual civic engagement platform built for a national hackathon. It empowers citizens to effortlessly report local infrastructure issues, discover targeted government schemes, and receive 24/7 assistance through an intuitive AI companion.

## 🚀 Killer Features

* **Multilingual AI Companion**: Native support for English, Hindi, and Marathi. Citizens can chat in their preferred language, and the AI automatically responds in the same language.
* **🎤 Voice-to-Text Input**: Integrated with the HTML5 `SpeechRecognition` API. Users can speak their queries directly into the chat in any supported language, removing typing barriers for less tech-savvy citizens.
* **📍 One-Click Geolocation Tagging**: Integrated with the HTML5 `Geolocation API`. Users reporting issues (like potholes or broken streetlights) can instantly fetch and attach their exact GPS coordinates with one click.
* **🎯 Hyper-Personalized Scheme Recommendations**: A smart recommendation engine that analyzes both **Age** and **Gender**. 
  * Recommends *Pradhan Mantri Matru Vandana Yojana* to adult women.
  * Recommends *Sukanya Samriddhi Yojana* to parents of young girls.
  * Recommends *Pre-Matric Scholarships* to students.
  * Recommends *Old Age Pensions* to senior citizens.
* **🛡️ Redundant AI Fallback**: The core AI is powered by Google's Gemini (1.5 Flash). If Gemini experiences downtime or high latency, the system automatically falls back to **Groq (LLaMA 3.1 8B)** ensuring 100% uptime for citizens.

## 🛠️ Tech Stack

* **Frontend**: Next.js (App Router), React, TypeScript, Vanilla CSS
* **Backend**: Next.js API Routes
* **Database & Auth**: Supabase (PostgreSQL)
* **AI Models**: Google Gemini (`gemini-1.5-flash`), Groq (`llama-3.1-8b-instant`)
* **Web APIs**: Geolocation API, Web Speech API

## 🏆 Hackathon Evaluation Criteria

This project was built from the ground up to score highly across standard evaluation metrics:
* **Code Quality**: Strict TypeScript typing, componentized architecture, and clean ESLint rules.
* **Efficiency**: Edge-ready Next.js routes, highly optimized hardware-accelerated native browser APIs (Voice/GPS), and blazing-fast AI inference via Groq fallback.
* **Accessibility**: Deep multilingual support (UI and AI responses) and Voice Input make the platform usable by citizens of all literacy levels.
* **Security**: Supabase Row Level Security (RLS) protects citizen data, and environment variables securely hide API keys.

## 💻 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd civic-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Database Setup (Supabase):**
   Ensure your Supabase project has an `issues` table and a `profiles` table. 
   Run this SQL in your Supabase SQL Editor to support the recommendation engine:
   ```sql
   ALTER TABLE profiles ADD COLUMN gender TEXT;
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing
Built with ❤️ for a smarter, more connected India.
