import { v4 as uuidv4 } from 'uuid';
import { QuizSettings } from '@/components/session-context';
import { ContainerBlock } from '@/components/quiz_components/container-comp';
import { ButtonBlock } from '@/components/quiz_components/variables/button-comp';
import { InputBlock } from '@/components/quiz_components/variables/input-comp';
import { TextBlock } from '@/components/quiz_components/info/text-comp';
import { QuizSession } from '@/components/session-context';
import { parseQuizData } from '@/lib/utils';
import { getCookie } from '@/lib/utils';

/**
 * Creates and initializes a new QuizSession with default UI blocks and settings.
 *
 * The created session contains a unique hash (generated via `uuidv4()`), a main
 * ContainerBlock that includes a title InputBlock, a placeholder TextBlock, and
 * a submit ButtonBlock, as well as default settings and empty collections for
 * groups and custom blocks. Counters for `nextId` and `nextGroup` are initialized
 * to 0.
 *
 * @returns {QuizSession} A fully initialized QuizSession object:
 *  - hash: unique identifier string (prefixed in settings title as `Quiz-<hash>`)
 *  - quiz: main ContainerBlock containing the default child blocks
 *  - groups: empty array
 *  - custom: empty array
 *  - settings: object with `quizSettings`, empty `conditions` array, and `globalStyle` string
 *  - nextId: 0
 *  - nextGroup: 0
 *
 * @remarks
 * - Default quizSettings:
 *   - title: `Quiz-<uniqueHash>`
 *   - blocksPerPage: false
 *   - allowBack: false
 * - Default main block classes and ordering mirror the UI layout expectations.
 *
 * @example
 * const session = createQuiz();
 * // session.hash -> 'a1b2c3...'
 * // session.quiz -> ContainerBlock with title input, placeholder text and submit button
 */
export const createQuiz = (): QuizSession => {
    const uniqueHash = uuidv4();

    const titleInput = new InputBlock("title", "", "", "Enter Quiz Title", "text-2xl font-bold");
    const placeholderInfo = new TextBlock("placeholder", "border border-dashed border-uni-black rounded p-4", "text-uni-grey text-nowrap text-center", "+ Add Blocks From The Left");
    const submitButton = new ButtonBlock("submit", "", "Submit");
    const mainBlock = new ContainerBlock("main", "space-y-4 p-4 border-x border-uni-grey min-w-[600px]", -1, 1, [titleInput, placeholderInfo, submitButton]);

    const quizSettings: QuizSettings = {
        title: `Quiz-${uniqueHash}`,
        blocksPerPage: false,
        allowBack: false
    }

    const settings  = {
        quizSettings: quizSettings,
        conditions: [],
        globalStyle: "",
    }

    const newQuizSession: QuizSession = {
        hash: uniqueHash,
        quiz: mainBlock,
        groups: [],
        custom: [],
        settings: settings,
        nextId: 0,
        nextGroup: 0
    };
    return newQuizSession;
};


 /**
   * Creates a new quiz session, updates the component state with the new session,
   * and navigates the user to the quiz creation page for that session.
   *
   * This function performs three side effects in sequence:
   * 1. Calls `createQuiz()` to create a new quiz session object (expected to include a `hash`).
   * 2. Calls `setQuizSession(...)` to store the newly created session in component state.
   * 3. Calls `router.push(...)` to navigate to the route `/{hash}/create-quiz` so the user can
   *    continue creating the quiz.
   *
   * @remarks
   * The function does not accept parameters and returns nothing. It relies on the external
   * `createQuiz`, `setQuizSession`, and `router` values being available in the surrounding scope.
   * Any errors thrown by those utilities (e.g., failed creation or navigation) will propagate
   * to the caller.
   *
   * @returns void
   *
   * @example
   * // When the user clicks a "New Quiz" button:
   * handleCreateQuiz();
   *
   * @throws {Error} If `createQuiz()` or `router.push()` fails, the error will bubble up.
   */
export const createDefaultQuiz = (setQuizSession: (session: QuizSession) => void, push: (path: string) => void) => {
    const newQuizSession = createQuiz();
    setQuizSession(newQuizSession);
    push(`/${newQuizSession.hash}/create-quiz`);
    return newQuizSession;
};


 /**
   * Attempts to load an existing quiz session from a cookie and, if confirmed by the user,
   * fetches the quiz data from the server and restores the quiz session in the UI.
   *
   * Behavior:
   * - Reads the cookie named "quizHash" via getCookie.
   * - If a quiz hash exists:
   *   - Prompts the user with window.confirm to decide whether to load the existing quiz.
   *   - If the user confirms:
   *     - Sends a POST request to '/api/quiz/load-quiz' with JSON body { hashKey: <cookie value> }.
   *     - Awaits and parses the JSON response. If the response contains an error, shows an alert
   *       with the error message and exits early.
   *     - Otherwise, parses the returned quiz data using parseQuizData, sets the quiz session
   *       via setQuizSession, and navigates to `/<hash>/create-quiz` using router.push.
   *   - If the user declines, delegates to handleCreateQuiz to start a new quiz.
   * - If no quiz hash cookie is present:
   *   - Alerts the user that no existing quiz was found and starts a new quiz by calling handleCreateQuiz.
   *
   * Side effects:
   * - Shows modal/alert dialogs (window.confirm and alert).
   * - Performs a network request (fetch).
   * - Calls parseQuizData and setQuizSession (mutates component/application state).
   * - Triggers navigation via router.push.
   * - May call handleCreateQuiz to create a new quiz session.
   *
   * Error handling notes:
   * - Network, parsing, or other runtime errors thrown during fetch, response.json(),
   *   parseQuizData(), or router.push() are not handled inside this function and will
   *   propagate to the caller unless wrapped in try/catch.
   * - The function explicitly checks for an error field in the server response and alerts it.
   *
   * @async
   * @returns Promise<void> - resolves when the load-or-create flow completes (or exits early on error).
   * @throws Any runtime errors from fetch, JSON parsing, parseQuizData, setQuizSession, or router.push.
   * @see getCookie, parseQuizData, setQuizSession, handleCreateQuiz, router.push
   */
export const loadQuiz = async (setQuizSession: (session: QuizSession) => void, push: (path: string) => void) => {
        const existingHash = getCookie('quizHash');

        if (existingHash) {
            const shouldLoad = window.confirm(`A quiz with id: ${existingHash} is already in progress. Do you want to load it?`);
            if (shouldLoad) {
                const response = await fetch('/api/quiz/load-quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({hashKey: existingHash}),
                });
                const result = await response.json();

                if (result.error) {
                    alert(result.error);
                    return;  // Exit if there's an error loading the quiz
                } else {
                    const loadedQuizSession = parseQuizData(result.quizData.quiz_data);
                    if (!loadedQuizSession) {
                        alert('Failed to parse loaded quiz data.');
                        return;
                    }

                    setQuizSession(loadedQuizSession);
                    push(`/${loadedQuizSession.hash}/create-quiz`);
                    return loadedQuizSession;
                }
            }
            else {
                return createDefaultQuiz(setQuizSession, push);
            }
        } else {
            alert('No existing quiz found.');
            return createDefaultQuiz(setQuizSession, push);
        }
};

