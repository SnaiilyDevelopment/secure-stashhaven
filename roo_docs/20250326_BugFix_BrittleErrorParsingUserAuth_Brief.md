# Roo Doc: Brittle Error Parsing in userAuth.ts

**Date:** 2025-03-26
**Error Type:** Bug / Style (Brittle Error Handling)
**File:** `src/lib/auth/userAuth.ts`
**Function:** `registerUser`
**Lines:** ~286-323 (Outer catch block)
**Tags:** #bug-fix, #error-handling, #supabase

## Context

The `BUG_REPORT.md` (Bug #5) noted brittle error message parsing in `userAuth.ts`. While partially resolved, the outer `catch` block within `registerUser` still relied on parsing specific strings from `error.message` (e.g., "User already registered", "Password should be at least"). This is unreliable as API error messages can change.

## Environment

*   **OS:** Windows 11
*   **Runtime:** Node.js (via Vite/Bun - based on project files)
*   **Frameworks:** React, Supabase
*   **TypeScript:** Yes

## Solution Attempt

Removed the string parsing logic within the outer `catch` block (lines 293-315). Simplified the logic to display a generic error message, relying on the inner `catch` block (handling the `supabase.auth.signUp` promise rejection) for more specific error handling like status code 429.

**Outcome:** Applied via `apply_diff`. Awaiting user confirmation.

## Knowledge Gaps / RAG Updates

*   **Pattern:** Relying on parsing specific strings in error messages is brittle.
*   **Recommendation:** Prefer checking specific error codes, status codes (like HTTP 429), or error types/names provided by the library (e.g., `AuthApiError` from Supabase) when available. Fall back to generic user-facing messages when specific codes aren't available or don't cover the case. #error-handling-best-practice