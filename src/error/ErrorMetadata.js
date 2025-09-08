/**
 * ErrorMetadata
 *
 * A utility class for managing structured metadata related to errors.
 * Supports both:
 *   • **Instance-level metadata** → per ErrorMetadata object.
 *   • **Global metadata** → shared across all instances.
 *
 * Each metadata entry is stored as an array: `[key, value, context]`.
 *
 * Changelog:
 * - 09/12/2024
 */

// Global metadata shared across all instances
let globalMetadata = [];

export class ErrorMetadata {
  /**
   * Initializes a new ErrorMetadata instance.
   * By default, it copies the current global metadata into the instance.
   */
  constructor() {
    this.metadata = [].concat(globalMetadata);
  }

  /**
   * Adds multiple metadata entries at once.
   *
   * @param {...Array} entries - One or more metadata arrays: `[key, value, context]`.
   * @returns {ErrorMetadata} Returns the current instance for chaining.
   *
   * @example
   * errorMeta.addEntries(
   *   ["userId", 123],
   *   ["page", "checkout"]
   * );
   */
  addEntries(...entries) {
    this.metadata.push(...entries);
    return this;
  }

  /**
   * Adds a single metadata entry.
   *
   * @param {string} key - The key or name of the metadata.
   * @param {*} value - The value associated with the key.
   * @param {*} [context] - Optional context or additional information.
   * @returns {ErrorMetadata} Returns the current instance for chaining.
   *
   * @example
   * errorMeta.addEntry("requestId", "abc-123", "API_CALL");
   */
  addEntry(key, value, context) {
    this.metadata.push([key, value, context]);
    return this;
  }

  /**
   * Checks whether this metadata instance has any entries.
   *
   * @returns {boolean} True if metadata is empty, otherwise false.
   */
  isEmpty() {
    return this.metadata.length === 0;
  }

  /**
   * Clears all metadata entries in this instance.
   *
   * @returns {void}
   */
  clearEntries() {
    this.metadata = [];
  }

  /**
   * Formats all metadata entries into an array of strings.
   * - Replaces colons `:` with underscores `_` inside each item.
   * - Joins each entry into a single string using `:`.
   *
   * @returns {string[]} A formatted list of metadata strings.
   *
   * @example
   * Input:  [["user", "123", "web"], ["env", "prod"]]
   * Output: ["user:123:web", "env:prod"]
   */
  format() {
    // return this.metadata.map((entry) => entry.join(":").replace(/:/g, "_"));

    const itemList = [];

    this.metadata.forEach((meta) => {
      if (meta && meta.length) {
        const normalizedMeta = meta
          .map((m) => {
            return m ? String(m).replace(/:/g, '_') : '';
          })
          .join(':');
        itemList.push(normalizedMeta);
      }
    });

    return itemList;
  }

  /**
   * Retrieves all metadata entries in raw format.
   *
   * @returns {Array[]} The raw list of metadata entries.
   */
  getAll() {
    return this.metadata;
  }

  /**
   * Adds a metadata entry to the **global** metadata store.
   *
   * @param {string} key - Metadata key.
   * @param {*} value - Metadata value.
   * @param {*} [context] - Optional context.
   * @returns {void}
   *
   * @example
   * ErrorMetadata.addGlobalMetadata("appVersion", "1.2.3");
   */
  static addGlobalMetadata(key, value, context) {
    globalMetadata.push([key, value, context]);
  }

  /**
   * Retrieves the current global metadata list.
   *
   * @returns {Array[]} The current global metadata entries.
   */
  static getGlobalMetadata() {
    return globalMetadata;
  }

  /**
   * Removes a specific metadata entry from the global store.
   *
   * @param {string} key - Metadata key.
   * @param {*} value - Metadata value.
   * @returns {void}
   *
   * @example
   * ErrorMetadata.unsetGlobalMetadata("appVersion", "1.2.3");
   */
  static unsetGlobalMetadata(key, value) {
    globalMetadata = globalMetadata.filter(
      (entry) => !(Array.isArray(entry) && entry[0] === key && entry[1] === value),
    );
  }
}
