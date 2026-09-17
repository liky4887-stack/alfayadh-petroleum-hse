# ALFAYADH PETROLEUM — الفياض النفط

## HSE Incident Management & Reporting System

A production-grade, enterprise-level Health, Safety, and Environment (HSE) mobile application built with React Native (Expo SDK 54) and TypeScript, backed by Supabase.

## Features

### Core Screens

1. **Home Dashboard** — Department-aware dashboard with KPI cards, heads-up feed, and today's tasks. Switches between Safety, Operations, Maintenance, and Logistics views.
2. **Actions** — Filterable report list (All, Safe, Unsafe, Open) with type badges and status pills.
3. **Assets** — Asset list with hero card, linked actions, and add-asset flow.
4. **Training** — Learn tab with course cards and quiz overlay; Manage tab for course creation and employee enrollment.
5. **Reports** — 5-step unsafe report wizard (classification, details, department, subcategory, status) and quick safe report form.
6. **Report Detail** — Full report view with edit, mark-closed, delete, location map link, and image display.
7. **Admin Panel** — PIN-gated admin dashboard with statistics and open reports.
8. **Profile** — Editable user profile with department selection.
9. **More** — Language toggle (English/Arabic), media library, help & support, logout.

### Design System

- Light theme with blue accent (`#138FC2`)
- Dark theme for report screens (obsidian/slate/emerald)
- 8px spacing system, 16-20px card radii
- Haptic feedback on all interactive elements
- Bilingual support (English/Arabic) with RTL handling

### Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Language:** TypeScript
- **Styling:** `StyleSheet.create()` only
- **Backend:** Supabase (PostgreSQL, Realtime, RLS, Storage)
- **State Management:** Zustand
- **Device APIs:** expo-image-picker, expo-location, expo-haptics
- **Icons:** lucide-react

### Project Structure

```
src/
├── components/       # Reusable UI (Header, Shared, Toast, ConfirmDialog, ErrorBoundary, ui)
├── i18n/             # Bilingual strings (English/Arabic)
├── lib/              # Supabase client, store, types, haptics, icons, department, i18n
├── navigation/       # AppNavigation (stack navigator)
├── screens/          # All app screens
└── theme/            # Color system (light + dark + image URLs)
```

### Database

Run `supabase/schema.sql` in the Supabase SQL Editor. Tables:

- `hse_reports` — safety observations (safe/unsafe_condition/unsafe_act)
- `actions` — HSE actions with priority, assignee, asset link
- `assets` — equipment/vehicles with status tracking
- `training_courses` — training modules with category
- `employees` — employee records
- `enrollments` — course enrollment tracking
- `user_roles` — per-user role (admin/supervisor/employee)
- `tasks`, `feeds`, `feed_comments`, `quiz_questions` — legacy tables

All tables have RLS enabled. Realtime is enabled on `hse_reports`, `tasks`, `feeds`, `feed_comments`.

### Storage

A public `hse-media` storage bucket is created for image uploads (report photos, asset images, course thumbnails).

## License

Enterprise — All rights reserved.
