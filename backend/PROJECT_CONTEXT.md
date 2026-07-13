# Project Context: Hey! PNU (안녕! 부산대)

Team: 5 Guys — PNU Creative Convergence AI Hackathon (7th), Convergence Track.

## Problem
Foreign students at PNU face fragmented info across the international office site,
dorm portal, and department pages — both when applying and after arriving. Survey data
in the PRD: top pain points are complicated application procedures (36.4%), unclear
university info (31.8%), visa/entry procedures (31.8%), and post-arrival: visa/immigration
issues (50%), account/contract setup (40%), bank account & phone setup (36.4%),
course registration & school systems (36.4%).

## Solution
A single web platform, "Hey! PNU," consolidating everything a foreign student needs
from application through graduation.

## Feature list (source of truth — implement against this)

**Account & profile**
- Sign up / login via student ID
- Profile: name, nationality, education, contact, interests

**Multilingual**
- UI in KO/EN/ZH/JA/VI
- AI-based real-time translation/localization
- Notices, chatbot, checklists all localized

**Info & search**
- Unified search across university/major/scholarship/admin/life info
- Smart notifications: deadlines, scholarship applications, course registration windows

**AI assistant**
- Q&A for admissions, academics, life, visa, career
- Personalized responses based on user context

**Emergency support**
- One-tap 119/112 dialing
- Embassy/consulate contacts by nationality
- Multilingual emergency guides

**Life & location**
- Map integration: immigration offices, hospitals, pharmacies, marts, banks
- Foreigner-friendly facility recommendations
- Housing/lease scam-prevention guide

**Newcomer checklist**
- Step-by-step "first 30 days" tasks: alien registration card, SIM, bank account

**Academics**
- AI course recommendation (major, remaining requirements, interests)
- Graduation requirement checklist (auto-calculates completed credits, flags gaps)
- Internship/part-time job postings (by major, with "see more")
- Extracurricular/club/competition recommendation AI (interest + career goals)

**Community**
- Boards by country and by department

**Campus**
- Facility usage guides (cafeteria, gym, library, clinic)
- GPS multilingual campus map + shuttle info

**Legal info**
- Work-permit rules for part-time jobs, relevant Korean law, emergency numbers

## Tech stack
- Frontend: React, HTML/CSS/JS
- Backend: Node.js
- DB: PostgreSQL
- AI tooling used in dev: Cursor, GitHub Copilot, Claude Code, OpenAI Codex
- AI in-product: ChatGPT/ Claude for planning & data structuring, Google AI Studio
  (Gemini API) for notice summarization/translation, Claude Design for UI

## Differentiation (vs. status quo)
Every feature above currently requires visiting a separate, Korean-only source
(int'l office site, department handouts, manual search). Hey! PNU's pitch is: one
platform, multilingual by default, personalized rather than generic.
