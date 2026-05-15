/**
 * safeJSON.ts — PinchPad©™
 *
 * HardShell utilities for parsing JSON safely to prevent application crashes
 * from malformed database or API state.
 *
 * Maintained by CrustAgent©™
 */

/**
 * Safely parses a JSON string. If parsing fails, logs a warning and returns the fallback value.
 *
 * @param jsonString The raw JSON string to parse.
 * @param fallback The default value to return if parsing fails or input is empty/invalid.
 * @returns The parsed object of type T, or the fallback value.
 */
export function scuttleParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[HardShell] ❌ JSON parse failed. Returning fallback.', {
      error,
      invalidString: jsonString.length > 100 ? `${jsonString.substring(0, 100)}...` : jsonString,
    });
    return fallback;
  }
}
