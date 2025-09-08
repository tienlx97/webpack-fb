/**
 * Changelog:
 * - 06/09/2025
 */

import performanceNow from 'fbjs/lib/performanceNow';

// Rate-limit config
const MAX_PER_WINDOW = 6; // p
const WINDOW_MS = 60_000; // q  (1 minute)
const EVICT_AGE_MS = 10 * WINDOW_MS; // r  (10 minutes)

// Per-key state: { timestamps: number[], droppedCount: number, lastAccess: number }
const stateByKey = new Map(); // s

// Cleanup bookkeeping: last time we ran cleanup()
let lastCleanupAt = 0; // t

/**
 * Periodically evict cold keys (not accessed for > 10 minutes).
 * Runs at most once per minute to avoid overhead.
 */
function cleanup() {
  // u()
  const ts = performanceNow();
  if (ts <= lastCleanupAt + WINDOW_MS) return;

  const tooOldBefore = ts - EVICT_AGE_MS;
  for (const [key, entry] of stateByKey) {
    if (entry.lastAccess < tooOldBefore) stateByKey.delete(key);
  }
  lastCleanupAt = ts;
}

/**
 * Attempt to record a log event for a given key.
 * - Returns a positive number when the log should be emitted.
 *   (It’s "droppedCount + 1", i.e., how many suppressed since the last allow.)
 * - Returns null when this event should be suppressed (rate limited).
 */
function record(key) {
  // aa()
  cleanup();

  const ts = performanceNow();
  let entry = stateByKey.get(key);

  // First time we see this key: allow and initialize
  if (!entry) {
    entry = {
      timestamps: [ts], // events within the rolling window
      droppedCount: 0, // how many we’ve recently dropped
      lastAccess: ts,
    };
    stateByKey.set(key, entry);
    return 1;
  }

  entry.lastAccess = ts;

  // Drop timestamps that fell out of the rolling 60s window
  const cutoff = ts - WINDOW_MS;
  while (entry.timestamps.length && entry.timestamps[0] < cutoff) {
    entry.timestamps.shift();
  }

  // If still under the per-window limit, allow and reset droppedCount
  if (entry.timestamps.length < MAX_PER_WINDOW) {
    const result = entry.droppedCount + 1;
    entry.droppedCount = 0;
    entry.timestamps.push(ts);
    return result; // truthy → should log
  }

  // Otherwise, suppress and bump droppedCount
  entry.droppedCount += 1;
  return null; // falsy → skip logging
}

/**
 * Public API matching your original usage.
 * Example: ErrorFilter.shouldLog({ hash: 'some-key' })
 */
export const ErrorFilter = {
  shouldLog(evt) {
    return record(evt.hash);
  },
};
