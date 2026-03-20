# PTO Website — Information Architecture
**Owner:** Product Agent / Product Management
**Version:** 1.0
**Date:** March 11, 2026

Reference document for page designs. Defines the site structure, page inventory, navigation model, and admin panel architecture.

---

## Architecture Decision: Separate Admin Panel

PTO administrators access a dedicated admin panel at `/admin/*` routes, fully behind Clerk authentication. The public site contains zero admin UI — no edit buttons, no inline controls, no visible admin affordances.

**Rationale:**
- Admins are volunteers with limited time and varying technical comfort. A dedicated space with only actionable controls is easier to learn.
- The Help Center (ADR-011) lives inside the admin panel, providing guidance in-context.
- Security is cleaner — all admin routes behind auth middleware, public site is entirely static/read-only from an admin perspective.
- No risk of admin UI leaking to public visitors.

**Admin login access:** Small "Admin" link in the public site footer bottom bar. Not prominent — admins bookmark `/admin` directly.

**MVP: Desktop-only admin panel.** The admin panel does not need to be mobile-responsive for MVP. PTO admins perform content management tasks (uploading files, creating events, editing text) that are more practical on a laptop. This reduces design and build scope significantly. Mobile admin support can be added post-launch if demand warrants it (Scale consideration).

---

## Public Site — Page Inventory

| Page | Route | Purpose | Complexity |
|---|---|---|---|
| Homepage | `/` | Landing page — mission, upcoming events preview, newsletter signup, social links | **LOCKED** — `homepage-design-final-v1.html` |
| Events List | `/events` | Upcoming events grouped by month (accordion, all expanded), with date blocks and Sign Up/Details buttons. Only upcoming events shown (no past). | **LOCKED** — `events-list-v1.html` |
| Event Detail | `/events/[id]` | Single event — description, date/time, location, volunteer signup (admin-configurable per event) | **LOCKED** — `event-detail-v1.html` |
| Volunteer Signup | (within Event Detail) | Signup for volunteer slots on a specific event (only shown if admin enables for that event) | **LOCKED** (part of Event Detail) |
| Newsletter Archive | `/newsletters` | Accordion by school year, seasonal badges, newsletter signup sidebar | **LOCKED** — `newsletter-archive-v1.html` |
| Newsletter Viewer | `/newsletters/[id]` | Breadcrumb strip + embedded PDF viewer (no download) | **LOCKED** — `file-viewer-v1.html` |
| Meeting Minutes | `/minutes` | Accordion by school year, seasonal badges, single-column (no sidebar) | **LOCKED** — `meeting-minutes-v1.html` |
| Minutes Viewer | `/minutes/[id]` | Same file viewer as newsletter (breadcrumb strip + embedded PDF) | **LOCKED** — `file-viewer-v1.html` |
| Sponsors | `/sponsors` | 4-col grid (2-col mobile), optional website links, storefront illustration, sponsor CTA | **LOCKED** — `sponsors-v1.html` |
| Donate | `/donate` | Page header + centered Venmo card with QR placeholder. No 501(c)(3) language. | **LOCKED** — `donate-v1.html` |
| Newsletter Signup | (embedded on Homepage) | MailerLite form embed for email signups | N/A — third-party embed |

---

## Admin Panel — Page Inventory

| Page | Route | Purpose | Complexity |
|---|---|---|---|
| Login | `/admin/login` | Clerk authentication (email + MFA) | Low (Clerk handles UI) |
| Dashboard | `/admin` | Quick stats, recent activity, nav to all sections | Medium |
| Events Manager | `/admin/events` | List all events, create/edit/delete | Medium |
| Event Editor | `/admin/events/new` or `/admin/events/[id]/edit` | Create or edit event details | High |
| Volunteer Slots Config | (within Event Editor) | Add/remove/edit volunteer roles and slot capacities per event | High (part of Event Editor) |
| View Signups | `/admin/events/[id]/signups` | Per-event volunteer signup list with contact info | Medium |
| Newsletter Manager | `/admin/newsletters` | List uploaded PDFs, upload new, delete | Low |
| Minutes Manager | `/admin/minutes` | List uploaded files, upload new, delete | Low |
| Sponsors Manager | `/admin/sponsors` | Logo grid management — upload, reorder, delete | Low |
| Homepage Editor | `/admin/homepage` | Edit mission text, photos, social links | Medium |
| Site Settings | `/admin/settings` | Venmo link, social media URLs, other config | Low |
| Help Center | `/admin/help` | How-to guides for each admin feature | Low (content-heavy, simple layout) |

---

## Navigation Model

### Public Site Nav
Primary navigation (header): Home, Events, Newsletters, Minutes, Sponsors, Donate
Footer: Social links, Newsletter signup link, Admin login link
Mobile: Hamburger menu with slide-down drawer (already designed in homepage)

### Admin Panel Nav
Sidebar navigation (persistent): Dashboard, Events, Newsletters, Minutes, Sponsors, Homepage, Settings, Help Center
No public site nav visible in admin — clean separation. A "View Site" link in the admin sidebar opens the public site in a new tab.

---

## Key Flows

### Parent views event and signs up to volunteer
Homepage → Events List → Event Detail → Volunteer Signup Form → Confirmation (stays on Event Detail)

### Admin creates an event with volunteer slots
Admin Login → Dashboard → Events Manager → Create Event → Configure Volunteer Slots → Save → Back to Events Manager

### Admin uploads a newsletter
Admin Login → Dashboard → Newsletter Manager → Upload PDF → Confirmation → Back to Newsletter Manager

### Admin updates homepage content
Admin Login → Dashboard → Homepage Editor → Edit fields → Save → Preview (opens public site in new tab)

---

## What's NOT in the Admin Panel

- **Newsletter subscriber management** — handled entirely in MailerLite. No duplication.
- **Analytics** — Vercel Analytics accessed via Vercel dashboard, not embedded in admin panel.
- **User/visitor accounts** — public site has no user accounts. Only admin accounts exist.
- **Email campaigns** — MailerLite handles all newsletter sending. Admin panel only manages the PDF archive.

---

## Content Display Rules

- **Newsletter Archive and Meeting Minutes are fully dynamic.** Only items that have been uploaded by an admin appear in the list. There are no placeholders, auto-generated entries, or empty slots for months without content. If the admin uploads 4 newsletters for a school year, only those 4 are shown.
- **School year accordion groups only render if they contain at least one item.** An empty school year section should not appear.
- The same principle applies to any other content list (sponsors, events) — only admin-created content is displayed.
- **Homepage events preview shows the next 30 days of events.** Events beyond 30 days from today are not shown on the homepage. The full events page (`/events`) shows all upcoming events with no time window restriction.
- **Events page groups events by month** using the same accordion pattern as newsletter/minutes pages. All month groups are expanded by default. Closest upcoming month appears first. Month groups with no events do not render.

---

## Volunteer Signup — Form Behavior

- **Admin-configurable per event.** The signup card only appears if the admin enables volunteer signup for that event. Events without signup show a single-column layout (no right card).
- **Simple signup model (MVP).** One signup form per event — no role selection. Admin assigns roles after signup.
- **Privacy:** Signups are private. Public visitors only see "X spots left" (remaining capacity). They do not see who has signed up.
- **Required fields:** Full Name, Email, Phone. All fields must be completed before submission.
- **Validation rules:**
  - Full Name: required, non-empty
  - Email: required, must be a valid email address
  - Phone: required, must be a valid phone number (US format)
- **Post-submission:** User stays on the Event Detail page with a confirmation message. Confirmation email sent via Resend with event details and volunteer instructions.

---

## Design Constraints (carry forward to all page designs)

- Mobile-first responsive design (public site)
- Admin panel: desktop-only for MVP
- Card-based layouts consistent with homepage
- Royal blue primary (#1B6DC2)
- Clean typography, generous white space
- WCAG 2.1 AA accessibility
- All file viewing in-browser (no forced downloads)
- Presigned R2 URLs for all file uploads (admin) and file serving (public)

---

## Design Progress — Gate 1 (Plan)

**Last updated:** March 12, 2026

### Public Pages — Locked Designs
| Page | File | Key Design Decisions |
|---|---|---|
| Homepage | `homepage-design-final-v1.html` | Hero section, upcoming events preview (30-day window, stacked time/location icons in Details column), newsletter signup, social links |
| Newsletter Archive | `newsletter-archive-v1.html` | Accordion by school year (current open, prior collapsed), seasonal emoji badges (varied within category), envelope SVG illustration (hidden mobile), newsletter signup sidebar |
| Meeting Minutes | `meeting-minutes-v1.html` | Same accordion/badge pattern as newsletter, single-column (no sidebar), clipboard SVG illustration (hidden mobile), max-width 800px |
| Sponsors | `sponsors-v1.html` | 4-col grid desktop / 2-col mobile, optional website links on hover, storefront SVG illustration, dark CTA section for sponsor inquiries |
| Donate | `donate-v1.html` | Standard page header for visual consistency, centered Venmo card with QR placeholder, gift box SVG illustration, no 501(c)(3) language |
| File Viewer | `file-viewer-v1.html` | Breadcrumb strip (blue-lt background, blue left accent on desktop, bottom border on mobile), embedded PDF viewer, no download button |
| Events List | `events-list-v1.html` | Month-based accordion grouping (all expanded by default), horizontal event cards with date blocks (full words desktop, abbreviations mobile), Sign Up/Details buttons, calendar SVG illustration, only upcoming events shown |
| Event Detail | `event-detail-v1.html` | Two-column layout (info + sticky signup card), breadcrumb back bar (blue-lt desktop), stacked meta rows with icons, volunteer signup form (name/email/phone, all required with validation), `.no-signup` single-column variant, green spots-left badge |

### Admin Pages — Locked Designs
| Page | File | Key Design Decisions |
|---|---|---|
| Login | `admin-login-v1.html` | Standalone page (no sidebar), centered Clerk placeholder with mock form fields, brand + Admin badge, "Back to public site" link |
| Dashboard | `admin-dashboard-v1.html` | 240px sticky sidebar + fluid main, 4 stat cards, 2×2 draggable tile grid (Quick Actions, Recent Activity, Upcoming Events, Newsletter Snapshot), HTML5 drag-to-reorder |
| Events | `admin-events-v1.html` | Three toggled views (List / Editor / Signups). 5-column table (Event, Date, Volunteers, Published, Actions) with colored action icons. Contact Volunteers modal with selectable recipient list, subject/body fields, CC admin checkbox. Event editor with volunteer signup toggle + spots config, publish toggle. Signups view with summary cards + full table + CSV export |
| Content | `admin-content-v1.html` | Two toggled views (Newsletters / Minutes). Inline upload form with title, school year, PDF drag-drop. File list grouped by school year with preview/delete actions |
| Sponsors | `admin-sponsors-v1.html` | Sponsor grid manager with logo upload, website link, reorder capability |
| Homepage | `admin-homepage-v1.html` | Homepage content editor for mission statement, hero image, social links |
| Settings & Help | `admin-settings-v1.html` | Two toggled views (Settings / Help Center). Settings: Org Info, Donation (Venmo QR upload), Contact Info cards. Help Center: searchable documentation with 7 accordion topic cards, live filter |

---

## Error & Edge Case Behaviors

Behavioral specs for error states, validation, and edge cases. These do not require dedicated mockups — the engineer should implement using shadcn/ui's built-in components (toast, alert, form validation, dialog).

### Volunteer Signup — Full Event
When all volunteer spots are filled, the public signup form remains visible and functional. Visitors can still register. The admin can see all signups (including overflow) in the View Signups screen and contact extra volunteers separately if needed to coordinate. The "spots left" badge on the public page shows "0 spots left" but does not disable the form.

**Rationale:** PTO events are informal. Turning people away with a hard block is worse than letting the admin manage overflow manually. Most events can accommodate a few extra volunteers.

### Event Publishing — Incomplete Fields
When an admin attempts to publish an event with missing required fields (title, date, location, start time), the system should: (1) highlight incomplete fields with a red border (`border-color: var(--red)`), (2) display a banner/toast at the top of the editor that reads "Please fill in all highlighted fields before publishing," and (3) prevent the publish action until resolved. Saving as draft is always allowed regardless of completeness.

**Required fields for publish:** Event title, date, location, start time. Description and end time are optional. Volunteer signup settings are optional (defaults to off).

### Delete Confirmation
All destructive actions (delete event, delete file, remove sponsor) must show a confirmation dialog before proceeding. The dialog should state: "This action can't be undone. Are you sure you want to delete [item name]?" with Cancel (default/focus) and Delete (red/danger) buttons. No bulk delete in MVP.

### Form Save Feedback
When an admin saves settings, creates/updates an event, or uploads a file, show a success toast ("Event saved," "Settings updated," etc.) that auto-dismisses after 3–4 seconds. On failure, show a persistent error toast with a retry option.

### Empty States
Tables and lists with no data should show a centered empty state message with an action prompt: "No events yet — create your first event" (with link to editor), "No newsletters uploaded yet," etc. No empty states needed for MVP settings or help center.

### Shared Design Patterns (established across all pages)
- **Nav wrap**: `.nav-wrap` container with sticky nav + flow-based drawer (mobile)
- **Page header**: White background, kicker + h1 + description + optional SVG illustration (illustration hidden on mobile)
- **Illustrations**: Hidden on mobile across all pages via `.is-mobile .page-header-illustration { display: none; }`
- **Admin link**: Footer only, hidden on mobile via `.admin-link` span
- **Accordion**: CSS max-height transition, current school year open by default, prior years collapsed
- **Seasonal badges**: Emoji-based, varied within season category (not identical)
- **Footer**: 4-col grid desktop, 1-col mobile, consistent across all pages

*All design files stored in `outcomes/PTO-Outcome/agents/product/docs/`*
