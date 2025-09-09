/**
 * Changelog:
 * - 09/12/2024
 */

/**
 * Safely renames a given function by overriding its `.name` property.
 *
 * @param {Function} func - The function to rename.
 * @param {string} name - The new name to set.
 * @returns {Function} The same function with an updated name.
 *
 * @example
 * function myFunc() {}
 * const renamed = renameFunction(myFunc, "BetterFunc");
 * console.log(renamed.name); // "<CUSTOM_NAME: BetterFunc>"
 */
export function renameFunction(func, name) {
  if (func && name) {
    try {
      // Attempt to redefine the "name" property of the function
      Object.defineProperty(func, 'name', {
        value: `<CUSTOM_NAME: ${name}>`,
        writable: false,
        configurable: true,
      });
    } catch {
      // Some environments (like older browsers) may not allow redefining the name property.
      // In that case, we silently fail to avoid breaking the app.
    }
  }
  return func;
}
