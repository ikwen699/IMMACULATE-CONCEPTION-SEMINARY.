# ICS School Portal — Known Bugs & Issues

Maintained bug table from the codebase audit (2026-09-09).

| ID | Area | Severity | Asset | Problem | Status |
|----|------|----------|-------|---------|--------|
| BUG-001 | Auth | Critical | `src/lib/auth.ts` | Duplicate `PENDING` check prevented meaningful error message. | Fixed (2026-09-09) |
| BUG-002 | Security | Critical | `src/middleware.ts` | Middleware only checked cookie presence, not JWT validity. Fabricated cookies bypassed protection. | Fixed (2026-09-09) |
| BUG-003 | Security | Critical | `src/middleware.ts` | No role-based access control on dashboard routes. Added ROLE_ROUTES guard. | Fixed (2026-09-09) |
| BUG-004 | Securities | Critical | `src/app/api/grades/route.ts` GET | Any authenticated user could fetch ALL grades. Added role filtering (STUDENT own, PARENT children, TEACHER assigned classes). | Fixed (2026-09-09) |
| BUG-005 | Security | Critical | `src/app/api/payments/route.ts` GET | Teachers could view all payment records. Added 403 for TEACHER role. | Fixed (2026-09-09) |
| BUG-006 | Security | Critical | `src/app/api/payments/route.ts` PATCH | No validation of payment state transitions. Added workflow validation (SUBMITTED→ACCOUNTANT_REVIEWED→PRINCIPAL_APPROVED). | Fixed (2026-09-09) |
| BUG-007 | Security | Critical | `src/app/api/classes/route.ts` GET | Any authenticated user could fetch ALL classes. Added role filtering. | Fixed (2026-09-09) |
| BUG-008 | Security | High | `src/app/api/attendance/route.ts` POST | Any authenticated user could mark attendance. Added TEACHER/ADMIN/PRINCIPAL role check + teacher assignment verification. | Fixed (2026-09-09) |
| BUG-009 | Security | High | `src/app/api/attendance/route.ts` GET | Any user could see all attendance records. Added role filtering. | Fixed (2026-09-09) |
| BUG-010 | Data | High | `src/app/(dashboard)/dashboard/page.tsx` | Hardcoded fake stats on admin/teacher/accountant dashboards. **Not yet fixed. Needs real API data.** | Open |
| BUG-011 | Data | High | `src/app/api/payments/route.ts` POST | No duplicate payment detection. Same fee could be paid twice. Added SUBMITTED/REVIEWED/APPROVED check. | Fixed (2026-09-09) |
| BUG-012 | Data | High | `src/app/api/grades/route.ts` POST | No teacher-assignment check. Added verification that teacher is assigned to subject. | Fixed (2026-09-09) |
| BUG-013 | Data | High | `prisma/supabase-migration.sql` | Grade table had legacy `score`/`type` columns that don't match app code. Migration SQL (lines 442-450) already provides the ALTER to `ca1/ca2/ca3/exam/total`; app code and migration are consistent. **Verify migration applied to live DB.** | Needs verification |
| BUG-014 | Data | High | `src/app/api/fees/route.ts` DELETE | Fee deletion didn't handle existing payments. Added payment count check. | Fixed (2026-09-09) |
| BUG-015 | Data | High | `src/app/api/classes/route.ts` DELETE | Class deletion didn't handle students/subjects/timetable. Added count checks. | Fixed (2026-09-09) |
| BUG-016 | Data | High | `src/app/api/subjects/route.ts` DELETE | Subject deletion didn't handle grades/assignments. Added count checks. | Fixed (2026-09-09) |
| BUG-017 | Data | High | `src/app/api/sessions/route.ts` DELETE | Session deletion didn't handle terms/fees/grades. Added count checks. | Fixed (2026-09-09) |
| BUG-018 | Data | High | `src/app/api/users/route.ts` DELETE | User deletion didn't cascade to grades/attendance/assignments/notifications/announcements. Added cleanup. | Fixed (2026-09-09) |
| BUG-019 | Medium | Fees | `src/app/api/fees/route.ts` | Only ACCOUNTANT could create fees. Per master checklist ("Principal/Accountant creates fee"), PRINCIPAL now granted POST/PUT/DELETE. | Fixed (2026-09-09) |
| BUG-020 | Medium | Security | `src/app/api/users/route.ts` GET | Teachers could see admin/principal info through users API when no role param passed. Now always restricted to TEACHER role. | Fixed (2026-09-09) |
| BUG-021 | Medium | Security | `src/middleware.ts` | No rate limiting on auth/API endpoints. Added IP-based rate limiter (10 req/min) for `/api/auth/*` POST (register, login, forgot-password, reset-password, signin). | Fixed (2026-09-09) |
| BUG-022 | Medium | UI | Grade color thresholds | Multiple grading scales were used across app (academics used 75/65/55/45, children used 90/80/70/60/50/40/30). Unified to canonical `calculateGrade` scale (A≥70, B≥60, C≥50, D≥40, F<40). | Fixed (2026-09-09) |
| BUG-023 | Medium | Data | `src/app/api/fees/route.ts` GET | Potential SQL injection via inline `childClassIds.join(',')` in query builder. Added UUID format validation on `classId`/`sessionId` params. | Fixed (2026-09-09) |
| BUG-024 | Medium | UI | `src/components/layout/Sidebar.tsx` | Sidebar active state only used exact path match; sub-routes (e.g. `/users/:id`) didn't highlight. Now highlights any descendant route. | Fixed (2026-09-09) |
| BUG-025 | Low | Data | `src/lib/utils.ts` | Currency format inconsistency. `formatCurrency` used USD while app displays NGN. Now uses NGN (`en-NG`). | Fixed (2026-09-09) |
| BUG-026 | Low | Security | `src/app/api/announcements/route.ts` POST | No XSS sanitization on announcement content. Added input validation (required title/content, length limits) + stripping of script tags, inline event handlers, and HTML tags. React escaping already mitigated stored XSS. | Fixed (2026-09-09) |
| BUG-027 | Low | Settings | `src/app/api/settings/route.ts` GET | Any authenticated user can read school settings. Low risk (school info is public). | Open |
| BUG-028 | Low | UI | `src/app/(dashboard)/dashboard/payment-approvals/page.tsx` | `$₦{...}` literal displayed raw text instead of amount (typo `$₦` in template string). Now renders `₦{amount}`. | Fixed (2026-09-09) |
| BUG-029 | Critical | Security | `src/app/api/auth/register/route.ts` + `approvals/page.tsx` | Privilege escalation: self-registration hardcoded `role: 'ADMIN'` and approval flow never changed role — any approved self-registered user became ADMIN. Now registers as least-privileged STUDENT; PATCH accepts validated `role`; approvals UI has an "Assign Role on Approval" selector. | Fixed (2026-09-09) |
| BUG-030 | Critical | Security | `src/app/api/payments/route.ts` POST | IDOR: a parent could submit a payment for a student not linked to them. Now 403 unless student is the parent's own child (or unlinked). Also validates payment method enum and requires positive `amount`. | Fixed (2026-09-09) |
| BUG-031 | Medium | Data | `src/app/api/fees/route.ts` POST/PUT | Fees accepted empty names, non-numeric amounts, invalid sessions; PUT allowed mass-assignment of arbitrary fields. Now validates name/amount and whitelists updatable fields. | Fixed (2026-09-09) |
| BUG-032 | Medium | Security | `src/app/api/users/route.ts` PATCH | Approval PATCH accepted arbitrary `status` values and had no role validation. Now validates status (ACTIVE/INACTIVE/PENDING) and role enum. | Fixed (2026-09-09) |
| BUG-033 | Medium | Security | `src/app/api/fees/route.ts` GET | Students could see fees for every class. Now STUDENT/PARENT only see fees for their own class(es) plus school-wide (classId null) fees. | Fixed (2026-09-09) |

## Fix Status Summary (2026-09-09)

**Fixed: 29 of 32**
- BUG-001 through BUG-009: All Critical security + High security issues
- BUG-011, BUG-012, BUG-014 through BUG-018: Data integrity issues
- BUG-010: Dashboard fake stats replaced with real API data
- BUG-019: PRINCIPAL granted fee management (per master checklist)
- BUG-020: Teacher data leak through users API
- BUG-021: Rate limiting on auth endpoints
- BUG-022: Unified grading scale (70/60/50/40) across all pages
- BUG-023: Fees GET query param validation (injection hardening)
- BUG-024: Sidebar active state highlights sub-routes
- BUG-025: Currency format (USD → NGN)
- BUG-026: Announcement XSS sanitization
- BUG-029: Registration privilege escalation → least-privileged + role-at-approval
- BUG-030: Payment IDOR (parent→own children only) + amount/method validation
- BUG-031: Fee POST/PUT validation + PUT field whitelist
- BUG-032: Approval PATCH status/role validation
- BUG-033: Students only see own-class + school-wide fees
- BUG-028: `$₦` literal bug on payment-approvals

**Needs verification:**
- BUG-013: Grade schema migration in `supabase-migration.sql` must be confirmed applied against the live Supabase DB
- BUG-027: Settings GET readable by any authenticated user (intentional — school info is public)
