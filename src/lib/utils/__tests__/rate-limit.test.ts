import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getRateLimitState,
  recordFailedAttempt,
  resetRateLimit,
  isBlocked,
  getBlockTimeRemaining,
  formatTimeRemaining,
} from "../rate-limit";

describe("rate-limit", () => {
  let mockSessionStorage: Record<string, string>;

  beforeEach(() => {
    mockSessionStorage = {};
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        mockSessionStorage[key] = undefined as unknown as string;
      }),
      clear: vi.fn(() => {
        mockSessionStorage = {};
      }),
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("getRateLimitState", () => {
    it("should return default state when no data stored", () => {
      const state = getRateLimitState();
      expect(state).toEqual({
        attempts: 0,
        lastAttempt: 0,
        blockedUntil: null,
      });
    });

    it("should return stored state", () => {
      const storedState = { attempts: 3, lastAttempt: 1000, blockedUntil: null };
      mockSessionStorage["auth_rate_limit"] = JSON.stringify(storedState);

      const state = getRateLimitState();
      expect(state).toEqual(storedState);
    });

    it("should return default state on parse error", () => {
      mockSessionStorage["auth_rate_limit"] = "invalid json";

      const state = getRateLimitState();
      expect(state).toEqual({
        attempts: 0,
        lastAttempt: 0,
        blockedUntil: null,
      });
    });

    it("should return default state when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);

      const state = getRateLimitState();
      expect(state).toEqual({
        attempts: 0,
        lastAttempt: 0,
        blockedUntil: null,
      });
    });
  });

  describe("recordFailedAttempt", () => {
    it("should increment attempts", () => {
      const state1 = recordFailedAttempt();
      expect(state1.attempts).toBe(1);

      const state2 = recordFailedAttempt();
      expect(state2.attempts).toBe(2);
    });

    it("should update lastAttempt timestamp", () => {
      const now = Date.now();
      const state = recordFailedAttempt();
      expect(state.lastAttempt).toBe(now);
    });

    it("should set blockedUntil after 5 attempts", () => {
      const now = Date.now();

      for (let i = 0; i < 4; i++) {
        const state = recordFailedAttempt();
        expect(state.blockedUntil).toBeNull();
      }

      const state = recordFailedAttempt();
      expect(state.attempts).toBe(5);
      expect(state.blockedUntil).toBe(now + 5 * 60 * 1000); // 5 minutes
    });

    it("should reset attempts after 15 minutes of inactivity", () => {
      recordFailedAttempt();
      recordFailedAttempt();
      recordFailedAttempt();

      // Advance time by 16 minutes
      vi.advanceTimersByTime(16 * 60 * 1000);

      const state = recordFailedAttempt();
      expect(state.attempts).toBe(1); // Reset to 1, not 4
    });

    it("should persist state to sessionStorage", () => {
      recordFailedAttempt();

      expect(sessionStorage.setItem).toHaveBeenCalledWith("auth_rate_limit", expect.any(String));
    });

    it("should return default state when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);

      const state = recordFailedAttempt();
      expect(state).toEqual({
        attempts: 0,
        lastAttempt: 0,
        blockedUntil: null,
      });
    });
  });

  describe("resetRateLimit", () => {
    it("should remove rate limit state from sessionStorage", () => {
      recordFailedAttempt();
      resetRateLimit();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith("auth_rate_limit");
    });

    it("should do nothing when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);

      resetRateLimit(); // Should not throw
      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("isBlocked", () => {
    it("should return false when not blocked", () => {
      expect(isBlocked()).toBe(false);
    });

    it("should return false when blockedUntil is null", () => {
      recordFailedAttempt();
      expect(isBlocked()).toBe(false);
    });

    it("should return true when blocked", () => {
      // Trigger 5 failed attempts to get blocked
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt();
      }

      expect(isBlocked()).toBe(true);
    });

    it("should return false and reset after block expires", () => {
      // Trigger 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt();
      }

      expect(isBlocked()).toBe(true);

      // Advance time past block duration (5 minutes + 1ms)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      expect(isBlocked()).toBe(false);
      expect(sessionStorage.removeItem).toHaveBeenCalledWith("auth_rate_limit");
    });

    it("should return false when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);

      expect(isBlocked()).toBe(false);
    });
  });

  describe("getBlockTimeRemaining", () => {
    it("should return 0 when not blocked", () => {
      expect(getBlockTimeRemaining()).toBe(0);
    });

    it("should return 0 when blockedUntil is null", () => {
      recordFailedAttempt();
      expect(getBlockTimeRemaining()).toBe(0);
    });

    it("should return remaining seconds when blocked", () => {
      // Trigger 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt();
      }

      expect(getBlockTimeRemaining()).toBe(300); // 5 minutes = 300 seconds
    });

    it("should return decreasing time as block expires", () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt();
      }

      vi.advanceTimersByTime(60 * 1000); // 1 minute
      expect(getBlockTimeRemaining()).toBe(240); // 4 minutes remaining
    });

    it("should return 0 when window is undefined (SSR)", () => {
      vi.stubGlobal("window", undefined);

      expect(getBlockTimeRemaining()).toBe(0);
    });
  });

  describe("formatTimeRemaining", () => {
    it("should format 300 seconds as 5:00", () => {
      expect(formatTimeRemaining(300)).toBe("5:00");
    });

    it("should format 299 seconds as 4:59", () => {
      expect(formatTimeRemaining(299)).toBe("4:59");
    });

    it("should format 60 seconds as 1:00", () => {
      expect(formatTimeRemaining(60)).toBe("1:00");
    });

    it("should format 59 seconds as 0:59", () => {
      expect(formatTimeRemaining(59)).toBe("0:59");
    });

    it("should format 9 seconds as 0:09 (with leading zero)", () => {
      expect(formatTimeRemaining(9)).toBe("0:09");
    });

    it("should format 0 seconds as 0:00", () => {
      expect(formatTimeRemaining(0)).toBe("0:00");
    });

    it("should format 1 second as 0:01", () => {
      expect(formatTimeRemaining(1)).toBe("0:01");
    });

    it("should handle large values", () => {
      expect(formatTimeRemaining(3661)).toBe("61:01"); // 1 hour + 1 minute + 1 second
    });
  });
});
