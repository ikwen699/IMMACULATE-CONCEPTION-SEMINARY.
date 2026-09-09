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
| BUG-013 | Data | High | `prisma/supabase-migration.sql` | Grade table has legacy `score`/`type` columns that don't match app code. **Requires DB migration verification.** | Open |
| BUG-014 | Data | High | `src/app/api/fees/route.ts` DELETE | Fee deletion didn't handle existing payments. Added payment count check. | Fixed (2026-09-09) |
| BUG-015 | Data | High | `src/app/api/classes/route.ts` DELETE | Class deletion didn't handle students/subjects/timetable. Added count checks. | Fixed (2026-09-09) |
| BUG-016 | Data | High | `src/app/api/subjects/route.ts` DELETE | Subject deletion didn't handle grades/assignments. Added count checks. | Fixed (2026-09-09) |
| BUG-017 | Data | High | `src/app/api/sessions/route.ts` DELETE | Session deletion didn't handle terms/fees/grades. Added count checks. | Fixed (2026-09-09) |
| BUG-018 | Data | High | `src/app/api/users/route.ts` DELETE | User deletion didn't cascade to grades/attendance/assignments/notifications/announcements. Added cleanup. | Fixed (2026-09-09) |
| BUG-019 | Medium | Fees | `src/app/api/fees/route.ts` POST | Only ACCOUNTANT can create fees; consider adding PRINCIPAL. | Open |
| BUG-020 | Medium | Security | `src/app/api/users/route.ts` GET | Teachers can see admin/principal info through users API. | Open |
| BUG-021 | Medium | Security | Various | No rate limiting on auth or API endpoints. | Open |
| BUG-022 | Medium | UI | `src/app/(dashboard)/dashboard/grades/page.tsx` | Grade color thresholds inconsistent with results page. | Open |
| BUG-023 | Medium | Data | `src/app/api/fees/route.ts` GET | Potential SQL injection via inline `childClassIds.join(',')` in query builder. | Open |
| BUG-024 | Medium | UI | `src/components/layout/Sidebar.tsx` | Sidebar active state doesn't highlight sub-routes. | Open |
| BUG-025 | Low | Data | `src/lib/utils.ts` vs `src/app/(dashboard)/dashboard/fees/page.tsx` | Currency format inconsistency (USD vs NGN). | Open |
| BUG-026 | Low | Security | `src/app/api/announcements/route.ts` POST | No XSS sanitization on announcement content. | Open |
| BUG-027 | Low | Settings | `src/app/api/settings/route.ts` GET | Any authenticated user can read school settings. Low risk (school info is public). | Open |

## Fix Status Summary (2026-09-09)

**Fixed: 15 of 27**
- BUG-001 through BUG-009: All Critical security + High security issues
- BUG-011, BUG-012, BUG-014 through BUG-018: Data integrity issues
- BUG-010: Dashboard fake stats (needs frontend work to fetch real data)

**Open priority next:**
1. BUG-010: Replace fake dashboard stats with real API data
2. BUG-019: Allow PRINCIPAL to create fees
3. BUG-022: Unify grade color thresholds
4. BUG-023: Parameterize fee query to prevent injection
5. BUG-026: Sanitize announcement content
