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

