"use client";


/**
 * Retrieve the value of a cookie by name from document.cookie.
 *
 * This function searches the document.cookie string for a cookie with the given
 * name and returns its value. Cookies in document.cookie are split on semicolons,
 * and leading spaces before each cookie token are removed before matching.
 *
 * Notes:
 * - The search matches "name=" at the start of each cookie token after trimming
 *   leading whitespace, so it will not match cookie names contained elsewhere.
 * - The returned value is the raw cookie substring; if the cookie value was
 *   encoded (e.g. with encodeURIComponent), call decodeURIComponent on the result.
 * - If multiple cookies share the same name, the first matching token found left-to-right
 *   in document.cookie is returned.
 *
 * @param name - The name of the cookie to retrieve. Defaults to 'quizHash'.
 * @returns The cookie value as a string if found, or null if no cookie with the given name exists.
 *
 * @example
 * // Retrieve the cookie named "sessionId"
 * const session = getCookie('sessionId');
 *
 * @example
 * // Retrieve the default cookie name "quizHash"
 * const hash = getCookie();
 *
 * @since 1.0.0
 */
export const getCookie = (name: string='quizHash'): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Remove leading spaces
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};