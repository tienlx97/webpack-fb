/**
 * Tracks whether the ErrorConfig has already been initialized.
 * Prevents accidental reconfiguration after the first setup.
 * @type {boolean}
 */
let isInitialized = false;

/**
 * Global Error Configuration.
 *
 * - Stores global error-handling flags.
 * - Can only be set **once** using `setup()`.
 * - Configuration is **frozen** to prevent accidental mutation.
 */
export const ErrorConfig = {
  /**
   * Default configuration values.
   * These can be overridden during the first `setup()` call.
   */
  config: {
    /** If true, duplicate error guards will be skipped. */
    skipDupErrorGuard: false,
  },

  /**
   * Initializes the error configuration **once**.
   * After the first call, subsequent calls are ignored.
   *
   * @param {Object} newConfig - The new configuration object.
   * @param {boolean} [newConfig.skipDupErrorGuard=false] - Whether to skip duplicate error guards.
   *
   * @example
   * ErrorConfig.setup({ skipDupErrorGuard: true });
   */
  setup: (newConfig) => {
    if (isInitialized === false) {
      isInitialized = true;

      // Freeze to prevent accidental runtime mutations
      ErrorConfig.config = Object.freeze(newConfig);
    }
  },
};
