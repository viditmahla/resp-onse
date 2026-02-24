# ERW India Simulator - PRD

## Original Problem Statement
Build a dashboard to show carbon transport potential of Indian rivers. ERW simulator with feedstock selection, omega threshold selection (5, 10, 15, 20, 25), omega comparison page, formal analysis with charts/graphs, and AI chatbot for data Q&A.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Data**: 1,542 samples from Excel file across 11 regions, 23 states, 279 rivers

## User Personas
- Environmental scientists analyzing ERW potential
- Climate researchers studying CDR across Indian rivers
- Policy makers evaluating regional carbon capture strategies

## Core Requirements
- [x] Dashboard with KPI metrics (Total CDR, Avg CDR, Samples, Success Rate)
- [x] Feedstock selector (calcite + upload new feedstocks)
- [x] Omega threshold selector (5, 10, 15, 20, 25)
- [x] Region-wise CDR bar chart and pie chart
- [x] Top rivers table and summary statistics
- [x] Simulator with scatter plots (Discharge vs CDR, Rock Addition vs CDR)
- [x] Geographic view of sampling locations
- [x] Analytics with distributions (pH, Alkalinity, DIC, pCO2, Temp, Rock Addition)
- [x] Correlation plots (pH vs CDR, Alkalinity vs CDR)
- [x] Regional analysis (CDR by Region, CDR by State)
- [x] Omega threshold comparison page
- [x] Data upload for new feedstock datasets
- [x] AI chatbot for data Q&A

## What's Been Implemented (Feb 24, 2026)
- Full backend with 15+ API endpoints
- Data seeding from Excel file (1,542 samples)
- 5 frontend pages: Dashboard, Simulator, Analytics, Comparison, Data
- AI Assistant using GPT-5.2 via Emergent
- Light lab dashboard theme (Work Sans + JetBrains Mono)

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High)
- Upload additional omega threshold datasets (10, 15, 20, 25)
- Enhanced map view with proper India map (react-simple-maps)

### P2 (Nice to Have)
- Export charts as PDF/PNG
- Data table CSV export
- Advanced filtering by multiple parameters
- Real-time omega simulation calculator
- User authentication for data management

## Next Tasks
1. User to upload additional feedstock/omega datasets
2. Enhanced India map visualization with topojson
3. PDF report generation
