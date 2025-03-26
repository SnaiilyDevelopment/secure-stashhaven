# Bug Report - secure-stashhaven Analysis (Auth Module) - Updated

This report details potential bugs, security vulnerabilities, performance bottlenecks, and style issues identified in the codebase, focusing on the authentication modules. It also includes the status and resolution applied to each finding.

---

## Findings

### 1. Insecure In-Memory Encryption Key Storage

*   **File Path:** `src/lib/auth/keyStore.ts`
*   **Line Number(s):** 7, 13-17, 23-25, 30-34 (Original)
*   **Severity:** High
*   **Issue Type:** Vulnerability / Security
*   **Description:** Storing the raw encryption key directly in a global JavaScript variable (`sessionEncryptionKey`) makes it potentially accessible to other scripts (e.g., via XSS) and difficult to clear reliably from memory.
*   **Status:** **Resolved (Mitigated)**
*   **Resolution:** The `sessionEncryptionKey` variable was encapsulated within a closure in `keyStore.ts`, preventing direct access from the global scope and limiting its accessibility strictly to the module's exported functions (`setSessionKey`, `getSessionKey`, `clearSessionKey`). This mitigates accidental leakage but doesn't fully prevent sophisticated memory inspection.

### 2. Password String Persistence in Memory

*   **File Path:** `src/lib/auth/userAuth.ts`
*   **Line Number(s):** 14 (param), 61-64 (comment), 195 (param), 229-232 (comment)
*   **Severity:** Medium
*   **Issue Type:** Security / Vulnerability
*   **Description:** Raw password strings passed as arguments persist in JavaScript memory due to string immutability and cannot be reliably zeroed out, potentially exposing them via memory dumps. The code comments acknowledge this.
*   **Status:** **Acknowledged (Inherent Limitation)**
*   **Resolution:** No code change possible due to JavaScript string immutability. The risk is acknowledged. Mitigation involves minimizing the scope/lifetime of password variables (already done) and ensuring UI components clear fields promptly.

### 3. Reliance on Client-Side Validation for Registration

*   **File Path:** `src/lib/auth/userAuth.ts`
*   **Line Number(s):** 197-226 (validation logic), 153-159 (criteria)
*   **Severity:** High
*   **Issue Type:** Vulnerability
*   **Description:** Critical registration validation (email format, password strength, confirmation match) is performed only on the client-side. This can be easily bypassed.
*   **Status:** **Requires Backend Changes**
*   **Resolution:** No frontend code change applied. **Crucially, identical validation rules (especially password strength) must be implemented server-side** (e.g., Supabase database policies, triggers, edge functions, or Auth configuration).

### 4. Missing Encryption Key Handling for OAuth Logins

*   **File Path:** `src/lib/auth/userAuth.ts` (lines 338-367), `src/lib/auth/index.ts` (lines 116-158)
*   **Severity:** High
*   **Issue Type:** Bug / Architectural / Missing Feature
*   **Description:** The OAuth sign-in flow authenticates the user but does not establish an encryption key. The `isAuthenticated` check correctly identifies this inconsistency (`AuthError.ENCRYPTION`), but functionality relying on the key will fail for OAuth users.
*   **Status:** **Requires Backend Changes**
*   **Resolution:** No frontend code change applied. The frontend correctly identifies the missing key state. **A backend strategy is required** to manage encryption keys consistently across login methods (e.g., store/derive key server-side linked to user ID, provide securely post-authentication).

### 5. Brittle Error Message Parsing

*   **File Path:** `src/lib/auth/userAuth.ts` (lines 301-313 - Registration), `src/lib/auth/index.ts` (lines 84-93 - Session Check)
*   **Severity:** Medium
*   **Issue Type:** Bug / Style
*   **Description:** Error handling logic relies on parsing specific strings within error messages. This is brittle.
*   **Status:** **Resolved (Frontend)**
*   **Resolution:**
    *   Registration error handling (`userAuth.ts`): Removed brittle string parsing from the outer `catch` block, relying on the inner `catch` for specific API errors (like 429) and using generic messages otherwise.
    *   Session check network error detection (`index.ts`): Refined logic to prioritize `TypeError` with 'failed to fetch' for browser network issues and check for `AuthApiError` from `@supabase/supabase-js`, removing brittle string parsing for generic network phrases. Relies on more specific error types now.
---