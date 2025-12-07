import { UserAccount, QuizContext, Group } from "@/session/types";
import { StyleRegistry, TemplateRegistry } from "@/engine/types/schema";


export async function saveQuizToDatabase(quizCtx: QuizContext) {
  try {
    // TODO: change api route to fit REST API conventions
    const response = await fetch("/api/quiz/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizJson: quizCtx }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.status);


    console.log("Quiz saved successfully!");
  } catch (error) {
    console.error("Error saving quiz:", error);
  }
};
 
export async function fetchUserAccount(googleId: string): Promise<UserAccount | null> {
  try {
    const res = await fetch(`/api/users/${googleId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) return null; // User not found (first login)
      throw new Error(`Failed to fetch user: ${res.statusText}`);
    }

    const rawData = await res.json();

    // REVIVE MAPS: Convert plain JSON objects back to Maps for the Engine
    return {
      ...rawData,
      styles: objToMap<any>(rawData.styles),
      templates: objToMap<any>(rawData.templates),
      groups: objToMap<Group>(rawData.groups),
    };
  } catch (error) {
    console.error("fetchUserAccount Error:", error);
    return null;
  }
}

export async function fetchQuizContext(creatorId: string, quizId: string): Promise<QuizContext | null> {
  try {
    const res = await fetch(`/api/quizzes/${creatorId}/${quizId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.statusText}`);

    const rawData = await res.json();

    // 1. Revive the Creator's Registries
    const creator = rawData.quizCreator;
    const revivedCreator: UserAccount = {
      ...creator,
      styles: objToMap(creator.styles),
      templates: objToMap(creator.templates),
      groups: objToMap(creator.groups),
    };

    // 2. Revive the Quiz Context
    return {
      ...rawData,
      quizCreator: revivedCreator,
      // Ensure other fields match expected types
      groups: rawData.groups || [],
      openSessions: rawData.openSessions || [],
      submission: rawData.submission || []
    };

  } catch (error) {
    console.error("fetchQuizContext Error:", error);
    return null;
  }
}


// --- HELPER: JSON Object -> Map Reviver ---
const objToMap = <V>(obj: Record<string, V> | any): Map<string, V> => {
  if (!obj) return new Map();
  return new Map(Object.entries(obj));
};