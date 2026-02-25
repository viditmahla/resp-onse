# ERW India Simulator - PRD

## Problem Statement
Dashboard for carbon transport potential of Indian rivers. ERW simulator with feedstock selection, omega threshold comparison (5,10,15,20,25), comprehensive water chemistry analytics, map, and AI chatbot.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor)
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Data**: 1,542 samples, 11 regions, 23 states, 828 geo-located points

## Implemented (Feb 25, 2026)
### Section 1 — Analytics (6 tabs)
- Overview: TA map, avg TA by basin, sample count
- Ion Chemistry: Ca/Mg bars, Ca vs Mg scatter, (Ca+Mg)/(Na+K) ratio, Ca box plot
- Carbonate: HCO3 bar, (Ca+Mg) vs HCO3, DIC bar, TA vs DIC
- Charge Balance: NICB histogram, Z+ vs Z- with 1:1 line, quality stacked bar
- Saturation: SI Calcite bar, SI histogram, pH vs SI, Ca vs SI
- CO2 Dynamics: pCO2 bar (420 uatm line), pCO2 vs pH, pCO2 vs DIC, CO2(aq) bar

### Section 2 — ERW Simulator
- Feedstock selector + omega threshold buttons
- General Analysis: 6 KPIs, CDR by region, top rivers table, summary stats
- Omega Comparison: side-by-side cards + region comparison chart

### Section 3 — Map
- 828 sampling locations, color by region/TA/pH/CDR

### Section 4 — More Insights
- CDR pie chart, state CDR, river rankings, key figures

### Section 5 — Data Management
- Upload new feedstock datasets, manage existing data

### AI Chat
- GPT-5.2 chatbot for data Q&A

## Backlog
- P1: Upload omega 10/15/20/25 datasets to unlock comparison
- P1: India boundary overlay on map (topojson)
- P2: PDF report generation
- P2: CSV export for data tables
