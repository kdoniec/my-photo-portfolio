interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const STORAGE_KEY = "auth_rate_limit";
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RESET_AFTER_MS = 15 * 60 * 1000; // Reset if 15 min passed since last attempt

function getDefaultState(): RateLimitState {
  return { attempts: 0, lastAttempt: 0, blockedUntil: null };
}

export function getRateLimitState(): RateLimitState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultState();
    }
    return JSON.parse(stored) as RateLimitState;
  } catch {
    return getDefaultState();
  }
}

export function recordFailedAttempt(): RateLimitState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  const state = getRateLimitState();
  const now = Date.now();

  // Reset if more than 15 minutes passed since last attempt
  if (now - state.lastAttempt > RESET_AFTER_MS) {
    state.attempts = 0;
    state.blockedUntil = null;
  }

  state.attempts += 1;
  state.lastAttempt = now;

  if (state.attempts >= MAX_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_DURATION_MS;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function resetRateLimit(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEY);
}

export function isBlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const state = getRateLimitState();
  if (!state.blockedUntil) {
    return false;
  }

  if (Date.now() > state.blockedUntil) {
    resetRateLimit();
    return false;
  }

  return true;
}

export function getBlockTimeRemaining(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const state = getRateLimitState();
  if (!state.blockedUntil) {
    return 0;
  }

  const remaining = state.blockedUntil - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
