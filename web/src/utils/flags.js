// web/src/utils/flags.js
/**
 * Converts a two-letter country code to a flag emoji
 * @param {string} countryCode - Two-letter country code (ISO 3166-1 alpha-2)
 * @returns {string|null} Flag emoji or null if invalid
 */
export function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return null;
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}