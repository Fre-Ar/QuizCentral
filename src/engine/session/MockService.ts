import { UserAccount, QuizContext } from "./types"
import { StyleRegistry, TemplateRegistry, QuizSchema, InteractionUnit, VisualBlock } from "@/engine/types/schema";
import { MOCK_SCHEMA, MOCK_USER } from "@/engine/blocks/MockQuiz"; 

// --- THE MOCK DB ---


export const MockService = {
  /**
   * Fetch User Profile + Registries
   */
  async getUser(googleId: string): Promise<UserAccount> {
    console.log(`[MockDB] Fetching User ${googleId}...`);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return MOCK_USER;
  },

  /**
   * Fetch a specific Quiz Schema
   */
  async getQuizContext(pageBlocks: any[], user: UserAccount): Promise<QuizContext> {
    await new Promise(r => setTimeout(r, 300));


    const schemaClone = MOCK_SCHEMA;
    const newSchema: QuizSchema = {
      id: schemaClone.id,
      meta: schemaClone.meta,
      config: schemaClone.config,
      state: schemaClone.state,
      pages: [
        {
          id: schemaClone.pages[0].id,
          title: schemaClone.pages[0].title,
          blocks: pageBlocks
        }
      ]
    }

    return {
      quizId: newSchema.id,
      quizCreator: user,
      quizSchema: newSchema,
    
      groups: [],
      openSessions: [], 
      submission: [],
    };
  },

  /**
   * Create a new blank quiz
   */
  async createQuiz(user: UserAccount, title: string): Promise<QuizContext> {
    const newId = `quiz_${Date.now()}`;
    const emptySchema: QuizSchema = {
      id: newId,
      meta: { title, description: "New Quiz" },
      config: { navigation_mode: "linear" },
      pages: []
    };
    
    // In real app: Save to DB and update User's quiz list
    user.quizzes.push({ id: newId, title });

    return {
      quizId: newId,
      quizCreator: user,
      quizSchema: emptySchema,

      groups: [],
      openSessions: [], 
      submission: [],
    };
  }
};