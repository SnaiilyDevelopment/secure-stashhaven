# Roo Doc: Brittle Error Parsing in index.ts (Session Check)

**Date:** 2025-03-26
**Error Type:** Bug / Style (Brittle Error Handling)
**File:** `src/lib/auth/index.ts`
**Function:** `performAuthCheck`
**Lines:** ~81-109 (Error handling for `supabase.auth.getSession`)
**Tags:** #bug-fix, #error-handling, #supabase, #network-error

## Context

The `BUG_REPORT.md` (Bug #5) noted brittle error message parsing in `index.ts` for detecting network errors during the `supabase.auth.getSession()` call. The existing code checked for `TypeError` and parsed generic strings like 'failed to fetch', 'network error', and 'connection refused'.

## Environment

*   **OS:** Windows 11
*   **Runtime:** Node.js (via Vite/Bun)
*   **Frameworks:** React, Supabase
*   **TypeScript:** Yes
*   **Dependency:** `@supabase/supabase-js`

## Solution Attempt

Refined the error handling logic:
1.  Imported `AuthApiError` from `@supabase/supabase-js`.
2.  Prioritized checking for `error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')` to identify likely browser network errors, returning `AuthError.CONNECTION`.
3.  Removed the brittle checks for generic strings like 'network error' and 'connection refused'.
4.  Added a check for `error instanceof AuthApiError` to handle specific Supabase API errors, returning `AuthError.SESSION`.
5.  Included a fallback case for other unexpected errors during the session check, also returning `AuthError.SESSION` but logging the specific error.

**Outcome:** Applied via `apply_diff`. Awaiting user confirmation.

## Knowledge Gaps / RAG Updates

*   **Pattern:** Relying on parsing generic strings in error messages is brittle.
*   **Recommendation:**
    *   Prefer checking specific error types (e.g., `AuthApiError`, `TypeError`) and codes/status properties when available.
    *   For browser network errors specifically, `TypeError` with 'failed to fetch' is a common indicator, though `navigator.onLine` can be a supplementary check.
    *   Leverage library-specific error types (`AuthApiError`) for more structured error handling. #error-handling-best-practice, #supabase, #network-error-detection