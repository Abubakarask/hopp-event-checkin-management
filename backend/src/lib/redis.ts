import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 50, 2000); // Backoff
  }
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

/**
 * Distributed lock for check-in processing.
 *
 * Uses SET NX EX — atomic "set if not exists" with a TTL.
 * If two stations scan the same guest at the same millisecond,
 * only one SET NX will succeed (Redis is single-threaded).
 * The loser gets an immediate "being processed" response
 * without ever hitting PostgreSQL.
 *
 * The TTL (default 10s) acts as a safety net — if the server
 * crashes mid-processing, the lock auto-expires.
 */
const LOCK_PREFIX = "checkin:lock:";
const LOCK_TTL_SECONDS = 10;

export async function acquireCheckinLock(
  guestId: string,
  stationId: string
): Promise<boolean> {
  try {
    const result = await redis.set(
      `${LOCK_PREFIX}${guestId}`,
      stationId,
      "EX",
      LOCK_TTL_SECONDS,
      "NX"
    );
    return result === "OK";
  } catch (e) {
    console.warn("Redis lock acquire failed, falling back to DB constraints:", e);
    // Fail open: assume lock acquired to let DB handle concurrency
    return true;
  }
}

export async function getCheckinLockHolder(
  guestId: string
): Promise<string | null> {
  try {
    return await redis.get(`${LOCK_PREFIX}${guestId}`);
  } catch (e) {
    return null;
  }
}

export async function releaseCheckinLock(guestId: string): Promise<void> {
  try {
    await redis.del(`${LOCK_PREFIX}${guestId}`);
  } catch (e) {
    console.warn("Redis lock release failed:", e);
  }
}

export default redis;
