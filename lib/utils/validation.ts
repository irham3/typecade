// ─── Security Validation Utilities ────────────────────────────────────────────
// Centralized validation functions to prevent data manipulation and injection.

/** Maximum realistic WPM (world record is ~300) */
const MAX_WPM = 380;
/** Maximum accuracy percentage */
const MAX_ACCURACY = 100;
/** Minimum test duration in seconds */
const MIN_DURATION = 1;
/** Maximum test duration in seconds (10 minutes) */
const MAX_DURATION = 600;

/**
 * Clamp and validate typing test results before saving to database.
 * Prevents submitting absurd WPM/accuracy values.
 */
export function sanitizeTestResult(wpm: number, accuracy: number, durationSeconds: number) {
    return {
        wpm: Math.max(0, Math.min(MAX_WPM, Math.floor(wpm))),
        accuracy: Math.max(0, Math.min(MAX_ACCURACY, Math.floor(accuracy))),
        durationSeconds: Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.floor(durationSeconds))),
    };
}

/**
 * Regex for safe display names and usernames.
 * Allows: letters (incl. unicode), numbers, spaces, underscores, hyphens, periods.
 * Prevents: HTML tags, script injection, special control characters.
 */
const SAFE_NAME_REGEX = /^[\p{L}\p{N}\s_\-\.]{1,30}$/u;

/**
 * Validate a display name or username for safety and length.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateDisplayName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) return "Name cannot be empty.";
    if (trimmed.length > 30) return "Name must be 30 characters or less.";
    if (!SAFE_NAME_REGEX.test(trimmed)) return "Name contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.";
    return null;
}

/**
 * Sanitize a room name — strips dangerous characters and enforces length.
 */
export function sanitizeRoomName(name: string): string {
    const trimmed = name.trim().slice(0, 40);
    // Strip anything that looks like HTML tags
    return trimmed.replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "");
}

/**
 * Allowed avatar MIME types.
 */
const ALLOWED_AVATAR_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

/** Maximum avatar file size in bytes (2 MB) */
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

/**
 * Validate an avatar file before upload.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateAvatarFile(file: File): string | null {
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
        return "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.";
    }
    if (file.size > MAX_AVATAR_SIZE) {
        return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 2MB.`;
    }
    return null;
}

/**
 * Password validation for sign-up.
 * Requires: >= 8 chars, at least 1 uppercase, 1 lowercase, 1 number.
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    return null;
}

/**
 * Map Supabase error codes/messages to user-friendly messages.
 * Prevents exposing internal database details.
 */
export function friendlyAuthError(error: { message?: string; code?: string }): string {
    const code = error.code ?? "";
    const msg = (error.message ?? "").toLowerCase();

    if (code === "over_email_send_rate_limit") return "Too many attempts. Please wait a minute before trying again.";
    if (code === "invalid_credentials" || msg.includes("invalid login")) return "Incorrect email or password.";
    if (code === "user_already_exists" || msg.includes("already registered")) return "An account with this email already exists.";
    if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "Please verify your email address first.";
    if (code === "weak_password" || msg.includes("weak password")) return "Password is too weak. Please use a stronger password.";
    if (msg.includes("network") || msg.includes("fetch")) return "Network error. Please check your connection.";
    if (msg.includes("rate limit") || msg.includes("too many")) return "Too many requests. Please slow down.";

    // Generic fallback — don't expose raw error
    return "Something went wrong. Please try again.";
}

/**
 * Simple client-side rate limiting for actions like room creation.
 * Returns a function that checks whether the action is allowed.
 */
export function createCooldownGuard(cooldownMs: number) {
    let lastActionTime = 0;
    return {
        /** Returns true if the action is allowed (cooldown has passed). */
        canProceed(): boolean {
            const now = Date.now();
            if (now - lastActionTime < cooldownMs) return false;
            lastActionTime = now;
            return true;
        },
        /** Returns remaining cooldown time in seconds. */
        remainingSeconds(): number {
            const elapsed = Date.now() - lastActionTime;
            const remaining = Math.max(0, cooldownMs - elapsed);
            return Math.ceil(remaining / 1000);
        },
    };
}
