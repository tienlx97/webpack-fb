/**
 * Changelog:
 * - 09/09/2025
 */

// Maximum number of debug info entries we keep in memory
const maxDebugInfo = 5;

// Stores collected debug info values
const debugInfoList = [];

/**
 * ErrorXFBDebug
 *
 * Utility for collecting and managing Facebook's `X-FB-Debug` headers.
 * These headers often contain extra diagnostic data returned from server responses.
 */
export const ErrorXFBDebug = {
  /**
   * Add a debug info string to the list.
   * Keeps the list capped at `maxDebugInfo` entries.
   *
   * @param {string} debugInfo - A debug string (usually from response headers).
   */
  add(debugInfo) {
    debugInfoList.push(debugInfo);

    // Remove the oldest entry if we exceed the max size
    if (debugInfoList.length > maxDebugInfo) {
      debugInfoList.shift();
    }
  },

  /**
   * Extracts and stores the `X-FB-Debug` header from an XMLHttpRequest response.
   *
   * @param {XMLHttpRequest} xhr - The XHR object to read headers from.
   */
  addFromXHR(xhr) {
    const allHeaders = xhr.getAllResponseHeaders();

    // Only proceed if headers exist and include "X-FB-Debug"
    if (allHeaders && allHeaders.indexOf('X-FB-Debug') >= 0) {
      const debugHeader = xhr.getResponseHeader('X-FB-Debug');

      // If a debug value exists, store it
      if (debugHeader) {
        ErrorXFBDebug.add(debugHeader);
      }
    }
  },

  /**
   * Retrieve all collected debug information.
   *
   * @returns {string[]} An array of the most recent debug info strings.
   */
  getAll() {
    return debugInfoList;
  },
};
