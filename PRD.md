# Product Requirements Document
## [Working Title] — Role-Based Society Management Platform

**Version:** 1.0
**Status:** Draft for build
**Intended use:** Reference document for AI-assisted development (Cursor / Antigravity). Keep this file at the project root and update it as decisions change — treat it as the source of truth the coding agent should check against before generating features.

---

## 1. Product Vision

MyGate and NoBrokerHood have proven the market — residential societies want digital gate management, billing, and communication. But both have become "super-apps" that serve residents, security guards, and management committees through a single bloated interface, and user research (App Store reviews, Reddit, community forums) shows this causes most of their complaints: ad-disguised alerts, notification overload, confusing UX for elderly residents and guards, and poor complaint transparency.

**Our thesis:** Build the same core functionality, but as **three purpose-built interfaces on one shared backend** — a minimal resident app, a one-tap guard console, and a power-user committee dashboard — with an explicit, marketed **no-ads, transparent-data** policy, and add a genuinely new capability (live in-premises worker/delivery tracking) that neither incumbent offers.

### 1.1 Positioning statement
> For residential societies frustrated with ad-cluttered, one-size-fits-all apps, [Product] is a society management platform that gives every user type — resident, guard, committee — an interface built for exactly what they need, with zero ads and full data transparency, unlike MyGate and NoBrokerHood which bury security alerts under promotions.

### 1.2 Non-goals (explicitly out of scope for v1–v2)
- Becoming a marketplace/super-app (grocery, insurance, home loans) — this was identified as a source of clutter, not a differentiator. Only revisit post-PMF, and only opt-in.
- Full ERP-grade accounting depth (matching MyGate's 250+ feature suite) in year one. We compete on experience first, depth second.
- Hardware manufacturing. BLE tags/readers are sourced from existing vendors (Phase 2), not built in-house.

---

## 2. Research Basis (Summary)

Consolidated from App Store reviews, Reddit, and community forum discussions on MyGate/NoBrokerHood:

| # | Pain Point | Frequency | Our Fix |
|---|---|---|---|
| 1 | Ads disguised as security alerts | Most common | Zero ads, ever. Alerts and promotions are structurally impossible to mix (see §4.1) |
| 2 | Privacy concerns / data monetization suspicion | High | Transparent data policy screen, no third-party data sharing, opt-in only |
| 3 | Poor/slow customer support | High | Committed SLA support channel from day one (Phase 1) |
| 4 | Too complex for elderly residents | High | Role-based simplicity, large-text mode, minimal menu depth |
| 5 | Feature bloat nobody uses | High | No marketplace features until explicitly requested by users post-launch |
| 6 | Slow performance / lag | Medium | Lightweight architecture, performance budget enforced (see §7.4) |
| 7 | Accounting frustration (committee side) | Medium (committee-specific) | Phase 2/3, built properly rather than rushed |
| 8 | Guard usability | Medium | Dedicated one-tap guard console, not a scaled-down resident app |
| 9 | Complaints disappear, no status | High | Ticket system with SLA timers and status tracking, modeled like an issue tracker |
| 10 | Notification overload | High | Categorized, independently-mutable notification channels |

---

## 3. Personas & Interfaces

### 3.1 Resident (mobile app)
Wants: fast visitor approval, pay maintenance, raise/track complaints, see notices. Does NOT want: clutter, ads, marketplace noise.

### 3.2 Security Guard (mobile app, separate build/login)
Wants: fastest possible visitor/staff entry logging, minimal typing, works even with low tech literacy. Needs offline-tolerant behavior (gate connectivity is often poor).

### 3.3 Committee / RWA Admin (web dashboard + mobile)
Wants: financial visibility, audit trail, analytics, staff/vendor management, the ability to configure society-wide settings (visitor policies, billing cycles, escalation rules).

> **Architecture implication:** these should be three separate front-end clients (could be 3 apps, or 1 app with 3 fundamentally different navigation shells selected at login) sharing one API and one data model. Do not build one adaptive UI that reveals/hides features by role — that reintroduces the bloat problem. Build genuinely separate experiences.

---

## 4. Monetization Strategy (No Ads)

This is the core marketing differentiator, so it needs to be durable — not just "no ads for now." Below is a multi-stream model where **every revenue stream is either B2B2C (society pays) or clearly-labeled opt-in**, never a disguised notification.

### 4.1 Hard rule (build this as a technical constraint, not just a policy)
The notification system should have **no code path** that allows a promotional/commercial message to use the same channel, styling, or priority level as a security/gate alert. This should be enforced at the schema level (see §7.3) — e.g. `notification.category` is a required enum with `SECURITY`, `BILLING`, `SOCIETY_NOTICE`, `COMMERCIAL`, and `COMMERCIAL` notifications are physically rendered in a separate, opt-in tab, never as a push notification styled like an alert. This is worth stating explicitly in the PRD because it's the promise competitors keep breaking.

### 4.2 Revenue streams

**Stream 1 — Society SaaS subscription (primary, Phase 1)**
The RWA/committee pays a per-unit monthly or annual fee (e.g. ₹X per flat/month), tiered by society size and feature tier (Basic / Standard / Pro with accounting). This mirrors how MyGate itself actually monetizes (societies pay, residents use for free) — but we make the value proposition explicit: "you're paying for an ad-free, well-supported product," rather than the incumbent pattern of pushing a mostly-free product and monetizing attention through ads.
- *Why it's durable:* committees already budget for this category of software. You are not asking residents to accept a new bill; you are replacing a line item they already pay, with better service.

**Stream 2 — Payment processing float/fee (Phase 1–2)**
A small, transparent processing fee (industry-standard range, disclosed upfront) on maintenance payments and amenity bookings routed through the app. This is standard fintech-in-PropTech economics (similar to how payment gateways charge merchants) and doesn't require showing anyone an ad.

**Stream 3 — Committee-tier add-ons (Phase 2–3)**
Full accounting/GST/audit module, advanced analytics, and multi-society management (for management companies running several RWAs) sold as an upsell to committees specifically — this is the audience that has budget and a clear ROI case (replacing Excel + accountant hours).

**Stream 4 — Hardware-as-a-service (Phase 2)**
The BLE tracking tags/readers are rented, not sold outright, to societies as part of the security tier — recurring hardware revenue (device + replacement + monitoring), which is a stickier revenue line than a one-time sale and ties directly to your differentiated feature.

**Stream 5 — Verified vendor directory, opt-in only (Phase 3, optional)**
If a marketplace is added at all, vendors pay a listing/lead fee — but it lives in a separate, opt-in "Services" tab that a resident has to navigate to deliberately. It never generates push notifications and is never shown on the home screen. This preserves the "no ad clutter" promise while leaving a monetization door open later without contradicting the marketing position.

**Stream 6 — Data insights product, aggregate-only (Phase 3, optional, sensitive)**
Anonymized, aggregated operational insights sold to committees or facilities-management partners (e.g. "average visitor dwell time," "peak entry hours") — never individual-level data, never sold to advertisers. Given pain point #2 was specifically about data trust, this stream needs a very clear, published data policy before launch, and arguably should be reviewed by counsel given India's DPDP Act before implementation.

### 4.3 Suggested pricing framing for marketing
"We don't sell your attention. Your society pays a transparent subscription — that's the whole business model." This single sentence is usable directly in App Store copy and onboarding screens.

---

## 5. Feature Roadmap by Phase

### Phase 1 — MVP (Target: single pilot society live)

**Resident App**
- [ ] Auth: phone OTP login, household/flat linking, approval by committee admin
- [ ] Visitor pre-approval: generate QR/OTP pass, share via link
- [ ] Real-time visitor-at-gate push notification with approve/deny (category: `SECURITY`, highest priority channel)
- [ ] Maintenance bill view + online payment + digital receipt
- [ ] Complaint ticketing: create with photo, category, priority; status tracker (Open → Acknowledged → In Progress → Resolved) with SLA countdown
- [ ] Society notices feed (category: `SOCIETY_NOTICE`, separate tab from alerts)
- [ ] Notification preferences screen — each category independently toggleable
- [ ] Privacy policy screen, plain-language, linked from onboarding (not buried in settings)

**Guard Console**
- [ ] Auth: staff ID + PIN (not OTP — guards may not have personal registered numbers)
- [ ] Single-screen visitor entry: photo capture, purpose selector, unit lookup, auto-notify resident
- [ ] Pending approvals queue with visible wait timer
- [ ] Staff/domestic-help daily attendance log (check-in/out)
- [ ] Offline queuing: entries logged locally and synced when connectivity returns

**Committee Dashboard (web-first, responsive)**
- [ ] Society setup: units, resident onboarding/approval, staff roster
- [ ] Visitor log with filters/export
- [ ] Complaint queue with SLA breach flagging
- [ ] Billing status overview (who's paid/pending)
- [ ] Basic notice broadcast tool

**Cross-cutting**
- [ ] Support channel live from day one (WhatsApp Business API or in-app chat with committed response SLA — directly answers pain point #3)
- [ ] Performance budget: cold start <2s, gate-approval push delivery <5s

### Phase 2 — Differentiation

- [ ] BLE-based live worker/delivery tracking: tag assignment at gate, geofenced expected-path definition per society, loitering/deviation alerts to guard + committee
- [ ] Full accounting module: GST-compliant invoicing, expense tracking, bank reconciliation, audit export
- [ ] Multilingual UI (start with 2–3 regional languages based on pilot society location)
- [ ] Accessibility mode: large text, high-contrast, simplified navigation for elderly residents
- [ ] Vehicle/RFID entry logging
- [ ] Amenity booking + payment

### Phase 3 — Scale

- [ ] Multi-society management for management companies/PMCs
- [ ] Optional verified vendor directory (opt-in, no push notifications)
- [ ] Aggregate analytics/insights product
- [ ] Smart lock / hardware integrations

---

## 6. Success Metrics

| Phase | Primary Metric | Target |
|---|---|---|
| Phase 1 pilot | Guard-side entry time per visitor | < incumbent benchmark (test against MyGate in same society if possible) |
| Phase 1 pilot | Complaint resolution SLA adherence | >90% within stated SLA |
| Phase 1 pilot | Resident app store rating | >4.5, specifically citing "no ads" in reviews (qualitative signal) |
| Phase 2 | Societies converted from incumbent | Track churn-in rate explicitly |
| Phase 2 | Revenue per society | Cover infra + support cost per society within X months |

---

## 7. Technical Notes for AI-Assisted Build (Cursor / Antigravity)

This section exists so an AI coding agent reading this file has enough architectural constraint to generate consistent code across sessions.

### 7.1 Recommended stack (adjust to your team's familiarity — these are chosen for fast AI-assisted iteration and strong ecosystem support in both tools)
- **Mobile (Resident + Guard apps):** React Native (Expo) — single codebase, fast iteration, huge community/training data for AI agents to draw on
- **Web (Committee dashboard):** Next.js + TypeScript
- **Backend:** Node.js (NestJS or Express) + TypeScript, REST or tRPC — keep one language across stack to reduce context-switching for the AI agent
- **Database:** PostgreSQL (relational integrity matters here — billing, audit trails, unit ownership)
- **Realtime:** WebSocket or Firebase Cloud Messaging / equivalent for the gate-approval push flow — this is the most latency-sensitive path in the product and should be built and load-tested first
- **File/photo storage:** S3-compatible object storage for visitor photos, complaint photos

### 7.2 Repo structure suggestion (monorepo)
```
/apps
  /resident-app      (React Native)
  /guard-app         (React Native)
  /committee-web     (Next.js)
/packages
  /shared-types      (TypeScript types shared across all clients + backend)
  /ui-resident       (design system: minimal, resident-facing)
  /ui-guard          (design system: large-tap-target, guard-facing)
  /ui-committee      (design system: data-dense, committee-facing)
/backend
  /api
  /notifications     (category-enforced notification service — see 7.3)
  /billing
/PRD.md              (this file)
```

### 7.3 Core data model constraints (enforce early)
```typescript
enum NotificationCategory {
  SECURITY = "SECURITY",           // visitor at gate, panic, loitering alert
  BILLING = "BILLING",
  SOCIETY_NOTICE = "SOCIETY_NOTICE",
  COMPLAINT_UPDATE = "COMPLAINT_UPDATE",
  COMMERCIAL = "COMMERCIAL"        // never pushed; opt-in tab only
}

interface Notification {
  id: string;
  category: NotificationCategory;   // required, no default — forces explicit choice at every call site
  isPush: boolean;                  // must be false for COMMERCIAL at the type level if possible
  societyId: string;
  ...
}
```
Tell the coding agent explicitly: **COMMERCIAL notifications must never set `isPush: true`.** Consider enforcing this with a discriminated union or a lint rule rather than relying on developer discipline, since this constraint is the product's core trust promise.

### 7.4 Performance budget (state these to the agent up front)
- Guard app cold start: < 2s on a mid-range Android device
- Gate-approval push notification delivery: < 5s end-to-end (guard taps "notify" → resident receives push)
- Resident app should function on 3-4 year old Android devices — avoid heavy animation libraries, test on low-end emulator profiles

### 7.5 Suggested build order for the AI agent
1. Shared types + Postgres schema (users, units, societies, visitors, notifications)
2. Auth flows for all three roles
3. Guard entry flow → resident push notification (this is the critical path; get it working end-to-end before building anything else)
4. Complaint ticketing + SLA tracking
5. Billing view (read-only first, payment integration second)
6. Committee dashboard views on top of the same data

---

## 8. Open Decisions (resolve before/during Phase 1 build)

- [ ] Pilot society: which one, and do you have a relationship/access to onboard it?
- [ ] Exact subscription price point and tiering (needs local market pricing research vs. MyGate/NoBrokerHood's published or estimated rates)
- [ ] Payment gateway partner (Razorpay, Cashfree, etc. — standard for Indian PropTech)
- [ ] Legal review of data policy and DPDP Act compliance before Phase 2 tracking feature ships
- [ ] Guard device provisioning — society-owned tablets/phones at the gate, or guard's personal device?
