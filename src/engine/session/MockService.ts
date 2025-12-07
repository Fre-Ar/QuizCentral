import { UserAccount, QuizContext } from "./types"
import { StyleRegistry, TemplateRegistry, QuizSchema } from "@/engine/types/schema";
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
  async getQuizContext(quizId: string, user: UserAccount): Promise<QuizContext> {
    console.log(`[MockDB] Fetching Quiz ${quizId}...`);
    await new Promise(r => setTimeout(r, 300));

    // In a real app, we fetch the JSON from DB. 
    // Here we return our MOCK_SCHEMA regardless of ID for demo purposes.
    // We clone it and assign the requested ID to simulate fetching different quizzes.
    const schemaClone = JSON.parse(JSON.stringify(MOCK_SCHEMA));
    // schemaClone.id = quizId;
    // schemaClone.meta.title = user.quizzes.find(q => q.id === quizId)?.title || "Untitled Quiz";

    return {
      quizId: quizId,
      quizCreator: user,
      quizSchema: schemaClone,
    
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