/**
 * Changelog:
 * - 10/09/2025
 */
import performanceNow from 'fbjs/lib/performanceNow';

/** Max events allowed per rolling window (per key). */
const MAX_PER_WINDOW = 6;

/** Rolling window size in ms (1 minute). */
const WINDOW_MS = 60_000;
/** Evict keys not touched for this long (10 minutes). */
const EVICT_AGE_MS = 10 * WINDOW_MS;

/**
 * Per-key state:
 * - timestamps: event times within the rolling window (ascending)
 * - droppedCount: how many were suppressed since last allowed emission
 * - lastAccess: last touch time (for cold-key eviction)
 * @type {Map<string, {timestamps:number[], droppedCount:number, lastAccess:number}>}
 */
const stateByKey = new Map();

/** Last time we ran cleanup(), to rate-limit cleanup work. */
let lastCleanupAt = 0;

/**
 * Evict cold keys (not accessed for > EVICT_AGE_MS).
 * Runs at most once per WINDOW_MS to keep overhead low.
 */
function cleanup() {
  // u()
  const now = performanceNow();
  if (now <= lastCleanupAt + WINDOW_MS) {
    return;
  }

  const tooOldBefore = now - EVICT_AGE_MS;
  for (const [key, entry] of stateByKey) {
    if (entry.lastAccess < tooOldBefore) {
      stateByKey.delete(key);
    }
  }
  lastCleanupAt = now;
}

/**
 * Update rate-limit state for a key and decide whether to emit.
 *
 * @param {string} key
 * @returns {number|null}
 *   - Positive number: emit and treat the value as (droppedCount + 1),
 *     i.e. how many were suppressed since last allow.
 *   - null: suppress (still over the limit).
 */
function record(key) {
  cleanup();

  const now = performanceNow();
  let entry = stateByKey.get(key);

  // First sighting: allow and initialize state
  if (!entry) {
    entry = {
      timestamps: [now], // events within the rolling window
      droppedCount: 0, // how many we’ve recently dropped
      lastAccess: now,
    };
    stateByKey.set(key, entry);
    return 1;
  }

  entry.lastAccess = now;

  // Drop old timestamps that are outside the rolling window
  const cutoff = now - WINDOW_MS;
  while (entry.timestamps.length && entry.timestamps[0] < cutoff) {
    entry.timestamps.shift();
  }

  // Under the cap? allow and reset droppedCount
  if (entry.timestamps.length < MAX_PER_WINDOW) {
    const result = entry.droppedCount + 1; // 1 + suppressed since last allow
    entry.droppedCount = 0;
    entry.timestamps.push(now);
    return result; // truthy → should log
  }

  // Otherwise, suppress and increment droppedCount
  entry.droppedCount += 1;
  return null; // falsy → skip logging
}

/**
 * ErrorFilter public API.
 * Example:
 *   if (ErrorFilter.shouldLog({ hash })) { ...emit... }
 */
export const ErrorFilter = {
  /**
   * Decide if an event should be logged based on its per-key rate.
   * @param {{hash:string}} evt
   * @returns {number|null} see `record()` docs
   */
  shouldLog(evt) {
    return record(evt.hash);
  },
};
