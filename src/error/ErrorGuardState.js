/**
 * ErrorGuardState
 *
 * Manages a stack of "guards" (execution contexts) for error tracking.
 * Each guard represents a protected function call within the ErrorGuard system.
 *
 * Responsibilities:
 *   - Keep track of the active guards during function execution.
 *   - Provide context for debugging and logging when an error occurs.
 *   - Support retrieving the current guard stack for reporting.
 *
 * Changelog:
 * - 09/12/2024
 */

const guardStack = [];

/**
 * State manager for error guard tracking.
 * Stores information about active guards and provides utility functions.
 */
export const ErrorGuardState = {
  /**
   * Push a new guard to the top of the stack.
   * Called whenever a function starts execution within an error guard.
   *
   * @param {Object} guard - Guard information.
   * @param {string} guard.name - The function name or guard label.
   * @param {*} [guard.deferredSource] - Optional source info for debugging.
   * @returns {void}
   */
  pushGuard: function (guard) {
    guardStack.unshift(guard);
  },

  /**
   * Pop the most recent guard off the stack.
   * Always called when leaving a protected function (inside `finally`).
   *
   * @returns {void}
   */
  popGuard: function () {
    guardStack.shift();
  },

  /**
   * Check whether there is at least one active guard.
   * Useful to know if we're currently inside an error-guarded execution.
   *
   * @returns {boolean} `true` if inside a guard, otherwise `false`.
   */
  inGuard: function () {
    return guardStack.length !== 0;
  },

  /**
   * Create a copy of the current guard stack containing only guard names.
   * Often used when reporting or logging errors.
   *
   * @returns {string[]} An array of guard names, ordered from newest to oldest.
   */
  cloneGuardList: function () {
    return guardStack.map((guard) => guard.name);
  },

  /**
   * Find the first non-null `deferredSource` in the guard stack.
   * This is often used to determine the root cause or context of an error.
   *
   * @returns {*} The first `deferredSource` found, or `undefined` if none exists.
   */
  findDeferredSource: function () {
    for (let i = 0; i < guardStack.length; i++) {
      const guard = guardStack[i];
      if (guard.deferredSource !== null && guard.deferredSource !== undefined) {
        return guard.deferredSource;
      }
    }
  },
};

// /**
//  * Changelog:
//  * - 09/12/2024
//  */

// const guardStack = [];

// // Error guard state management
// export const ErrorGuardState = {
//   pushGuard: function (guard) {
//     guardStack.unshift(guard);
//   },
//   popGuard: function () {
//     guardStack.shift();
//   },
//   inGuard: function () {
//     return guardStack.length !== 0;
//   },
//   cloneGuardList: function () {
//     return guardStack.map((guard) => guard.name);
//   },
//   findDeferredSource: function () {
//     for (let i = 0; i < guardStack.length; i++) {
//       let guard = guardStack[i];
//       if (guard.deferredSource !== null) {
//         return guard.deferredSource;
//       }
//     }
//   },
// };
