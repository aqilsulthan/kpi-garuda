KPI Management System
A KPI management system using Next.js App Router, NextAuth v5 for authentication, PostgreSQL for database, and Dify Enterprise with Qwen LLM for AI analysis.
The system offers 3 roles: admin (upload Excel, manage users/external data), corporate_planning (scorecard dashboard, trigger AI, send reports to BOD), and direksi (read published reports, chat with AI).

Structure:
- `app/admin/`: Admin features (upload, KPI list, users).
- `app/planning/`: Corporate planning workspace.
- `app/board/`: Board of Directors view.
- `app/api/`: API routes including NextAuth, Dify proxy, KPI parsing.
- `components/`: React components.
- `lib/`: Utilities for auth, DB, Dify, Excel parser.
- `scripts/sql/`: Database initialization scripts.