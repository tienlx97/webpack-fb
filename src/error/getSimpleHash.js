/**
 * Changelog:
 * - 09/09/2025
 *
 * Generates a simple 6-character hash string from one or more input strings.
 * Uses a custom 32-character alphabet to encode a truncated hash.
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz012345';

/**
 * Generate a simple, deterministic hash from the given strings.
 *
 * @param {...string} args - One or more strings to include in the hash.
 * @returns {string} A 6-character hash string.
 *
 * @example
 * getSimpleHash("hello")       // "l4p5fz" (deterministic)
 * getSimpleHash("a", "b", "c") // Always same result for same inputs
 */
function getSimpleHash(...args) {
  let hashValue = 0;

  // Step 1. Process each string in the input list
  for (let idx = 0; idx < args.length; idx++) {
    const str = args[idx];

    // Skip falsy inputs like null, undefined, '', 0, false
    if (!str) continue;

    // Step 2. Accumulate hash value based on character codes
    for (let charIndex = 0; charIndex < str.length; charIndex++) {
      const charCode = str.charCodeAt(charIndex);

      // Classic 32-bit hash algorithm:
      // hash = hash * 31 + charCode
      hashValue = (hashValue << 5) - hashValue + charCode;
    }
  }

  // Step 3. Convert hashValue into a 6-character encoded string
  let hashString = '';
  for (let i = 0; i < 6; i++) {
    // Use the last 5 bits as an index into the ALPHABET (32 chars)
    hashString = ALPHABET.charAt(hashValue & 31) + hashString;

    // Shift right 5 bits for next iteration
    hashValue >>= 5;
  }

  return hashString;
}

export { getSimpleHash };

// /**
//  * Changelog:
//  * - 09/12/2024
//  */

// const g = 'abcdefghijklmnopqrstuvwxyz012345';

// function getSimpleHash(...args) {
//   let a = 0;
//   // eslint-disable-next-line no-var, no-inner-declarations
//   for (var b = args.length, c = new Array(b), d = 0; d < b; d++) c[d] = args[d];
//   for (let e = 0; e < c.length; e++) {
//     const f = c[e];
//     if (f) {
//       const h = f.length;
//       for (let i = 0; i < h; i++) a = (a << 5) - a + f.charCodeAt(i);
//     }
//   }
//   let j = '';
//   // eslint-disable-next-line no-sequences, no-unused-expressions
//   for (let k = 0; k < 6; k++) (j = g.charAt(a & 31) + j), (a >>= 5);
//   return j;
// }

// export { getSimpleHash };
