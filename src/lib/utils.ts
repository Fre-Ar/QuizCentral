import { QuizBlock } from "@/components/quiz_components/quiz-comp";
import { ContainerBlock } from "@/components/quiz_components/container-comp";
import { TextBlock } from "@/components/quiz_components/info/text-comp";
import { ButtonBlock } from "@/components/quiz_components/variables/button-comp";
import { InputBlock } from "@/components/quiz_components/variables/input-comp";
import { QuizSession } from "@/components/session-context";
import { types, VarBlock } from "@/components/quiz_components/variables/var-comp";


/**
 * Serialize a quiz session object to JSON and trigger a browser download of the resulting file.
 *
 * The function:
 *  - Converts the provided `quizSession` to a pretty-printed JSON string (2-space indentation).
 *  - Creates a Blob with MIME type `application/json`.
 *  - Creates a temporary anchor (<a>) element, sets its `download` attribute to `filename`,
 *    creates an object URL for the Blob and assigns it to the anchor's `href`,
 *    appends the anchor to the document, programmatically clicks it to start the download,
 *    and then removes the anchor from the document.
 *
 * Notes:
 *  - This function is intended to run in a browser environment. It will not work in non-DOM environments
 *    (e.g., Node.js) because it relies on `document`, `Blob`, and `URL.createObjectURL`.
 *  - The created object URL is not explicitly revoked in the implementation. In long-running applications
 *    you may want to call `URL.revokeObjectURL` after the download to release resources.
 *
 * @param quizSession - The quiz session data to serialize and download. Can be any JSON-serializable value.
 * @param filename - Optional filename to use for the downloaded file. Defaults to `'quizSession.json'`.
 * @returns void
 *
 * @example
 * // Trigger a download of the current quiz session
 * downloadQuizSession(currentSession, 'my-quiz-session.json');
 */
export function downloadQuizSession(quizSession: any, filename: string = 'quizSession.json') {
    // Convert the quizSession object to a JSON string
    const jsonString = JSON.stringify(quizSession, null, 2); // Pretty-print JSON with 2 spaces
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a link element
    const link = document.createElement('a');
    
    // Set the download attribute with a filename
    link.download = filename;
    
    // Create a URL for the Blob and set it as the href attribute
    link.href = URL.createObjectURL(blob);
    
    // Append the link to the body (it won't be visible)
    document.body.appendChild(link);
    
    // Programmatically click the link to trigger the download
    link.click();
    
    // Remove the link from the document
    document.body.removeChild(link);
  }
  
  // Function to identify the type of QuizBlock and instantiate it accordingly
    /**
   * Parse a raw block object (typically deserialized from JSON) into a concrete QuizBlock instance.
   *
   * The function inspects the properties of the provided `block` and returns one of the concrete
   * block classes used by the quiz system:
   * - ContainerBlock when `block.children` is an array (children are parsed recursively).
   * - ButtonBlock when `block.id === 'submit'`.
   * - VarBlock when `block.type` is a string and either matches an allowed entry from the
   *   `types` array or is the empty string (`''`).
   * - TextBlock when `block.text` is a string.
   * - InputBlock when `block.def` is a string.
   *
   * Parsing behavior and defaulting:
   * - Many optional properties are tolerated on the incoming object; when absent, sensible defaults
   *   (empty strings, undefined, or booleans) are used to construct the concrete block instances.
   * - For container blocks, children are mapped through `parseQuizBlock` recursively so nested
   *   structures are preserved.
   *
   * Expected/recognized raw block properties (not exhaustive but the ones consumed by the parser):
   * - id: string
   * - children: any[]
   * - style: string
   * - rows, columns: number
   * - hidden: boolean
   * - text: string
   * - type: string
   * - value, name: string
   * - options: any[]
   * - maxlength, min, max, step, width, height: number
   * - pattern, placeholder, font, tooltip: string
   * - required, disabled, readonly, central, neutral, incomplete: boolean
   * - def: string
   *
   * @param block - The raw block object to parse. It may be any shape; the function will try to
   *                recognize it by the presence and types of certain properties and convert it
   *                into the appropriate QuizBlock subtype.
   * @returns A new instance of a subclass of QuizBlock (ContainerBlock, ButtonBlock, VarBlock,
   *          TextBlock or InputBlock) representing the provided raw block.
   * @throws Error If the provided object cannot be recognized as any supported block type.
   *
   * @remarks
   * - The parser relies on an external `types` collection when deciding whether a `block.type`
   *   value is valid for producing a VarBlock. If `types` contains the given `block.type` (or the
   *   type is the empty string), a VarBlock will be created.
   * - The special id `'submit'` always yields a ButtonBlock regardless of other properties.
   * - This function is pure with respect to the input object structure (it does not mutate the
   *   input) but returns new instances of the library's block classes.
   *
   * @example
   * // Example usage:
   *  const parsed = parseQuizBlock({ id: 'q1', type: 'multiple-choice', value: 'a', name: 'q1', options: [...] });
   * 
   * // parsed is a VarBlock instance
   */
  export const parseQuizBlock = (block: any): QuizBlock => {
    if ('children' in block && Array.isArray(block.children)) {
      // Recursively parse children
      const children = block.children.map(parseQuizBlock);
      return new ContainerBlock(block.id, block.style || '', block.rows || 1, block.columns || 1, children, block.hidden || false);
    } else if (block.id === 'submit') {
      return new ButtonBlock(block.id, block.style || '', block.text || '', block.hidden || false);
    } else if ('type' in block && typeof block.type === 'string' && (types.includes(block.type) || block.type==='')) {
      return new VarBlock(
        block.id,
        block.type || 'button',
        block.style || '',
        block.value || '',
        block.name || '',
        block.options || [],
        block.maxlength || undefined,
        block.pattern || '',
        block.placeholder || '',
        block.min || undefined,
        block.max || undefined,
        block.step || undefined,
        block.width || undefined,
        block.height || undefined,
        block.required || false,
        block.disabled || false,
        block.readonly || false,
        block.tooltip || '',
        block.central || false,
        block.neutral || false,
        block.incomplete || false,
        block.hidden || false
      );
    } else if ('text' in block && typeof block.text === 'string') {
      return new TextBlock(block.id, block.style || '', block.font || '', block.text, block.hidden || false);
    } else if ('def' in block && typeof block.def === 'string') {
      return new InputBlock(block.id, block.style || '', block.def, block.placeholder || '', block.font || '', block.hidden || false);
    }  else {
      throw new Error('Unknown block type');
    }
  };
  
  /**
   * Parse and validate a raw quiz JSON payload into a strongly-typed QuizSession.
   *
   * The function performs a set of structural validations on the provided `json` payload:
   * - `json` must be an object
   * - `json.hash` must be a string
   * - `json.quiz` must be an object (will be parsed via `parseQuizBlock`)
   * - `json.groups` must be an array
   * - `json.custom` must be an array
   * - `json.settings` must be an object
   *
   * If the payload passes these checks, the function attempts to parse the main quiz block
   * using `parseQuizBlock`. On success it returns a new object that spreads the original
   * payload and replaces the raw `quiz` block with the parsed representation (i.e. a
   * `QuizSession`). If any check fails or parsing the quiz block throws, the function
   * logs an error and returns `null`.
   *
   * Notes:
   * - The function is defensive: it never throws for invalid input — it either returns a
   *   parsed `QuizSession` or `null` and logs parsing errors to the console.
   * - The function accepts any shape for `json` (typed as `any`) and performs runtime checks
   *   before attempting to access nested properties.
   *
   * @param json - The raw JSON payload to validate and parse. Expected to contain the keys:
   *               `hash`, `quiz`, `groups`, `custom`, and `settings`.
   * @returns The parsed `QuizSession` on success, or `null` if validation fails or parsing
   *          of the quiz block fails.
   *
   *
   * @throws Nothing — errors during parsing are caught internally; parse errors are logged
   *                 and result in a `null` return value.
   *
   * @public
   * @since 1.0.0
   */
  export const parseQuizData = (json: any): QuizSession | null => {
    if (
      json &&
      typeof json === 'object' &&
      typeof json.hash === 'string' &&
      typeof json.quiz === 'object' &&
      Array.isArray(json.groups) &&
      Array.isArray(json.custom) &&
      typeof json.settings === 'object'
    ) {
      try {
        const parsedQuiz = parseQuizBlock(json.quiz); // Parse the main quiz block
        return {
          ...json,
          quiz: parsedQuiz,
        };
      } catch (error) {
        console.error('Error parsing quiz blocks:', error);
        return null;
      }
    }
    return null;
  };

  
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