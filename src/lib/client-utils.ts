"use client";

import { QuizSession, Group } from "@/components/session-context";
import { parseQuizData } from "./utils"; // server logic stays separate but reusable
import { v4 as uuidv4 } from "uuid";


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

/**
 * Download a quiz session as a JSON file (client-only function).
 */
export function downloadQuizSession(
  quizSession: any,
  filename: string = "quizSession.json"
) {
  const jsonString = JSON.stringify(quizSession, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Launch quiz → calls API route → sets cookie
 */
export const launchQuizToSupabase = async (
  quizSession: QuizSession,
  launchedGroup: Group
) => {
  try {
    const response = await fetch("/api/quiz/launch-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizSession, launchedGroup }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    document.cookie = `quizHash=${quizSession?.hash}; path=/; max-age=${
      7 * 24 * 60 * 60
    }; secure; samesite=strict`;
  } catch (error) {
    console.error("Error launching quiz:", error);
  }
};

/**
 * Save quiz → calls API route → sets cookie + alert
 */
export const saveQuizToSupabase = async (quizSession: QuizSession) => {
  try {
    const response = await fetch("/api/quiz/save-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizJson: quizSession }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.status);

    document.cookie = `quizHash=${quizSession?.hash}; path=/; max-age=${
      7 * 24 * 60 * 60
    }; secure; samesite=strict`;

    alert(data.message);
  } catch (error) {
    console.error("Error saving quiz:", error);
  }
};

/**
 * File reader for quiz import
 */
const handleFileUpload = (
  e: React.ChangeEvent<HTMLInputElement>,
  setQuizSession: (data: QuizSession | null) => void
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target?.result as string);
      const parsed = parseQuizData(json); // server-safe logic

      if (parsed) {
        setQuizSession(parsed);
        alert("Quiz session successfully loaded.");
      } else {
        alert("Invalid quiz session format.");
      }
    } catch (error) {
      alert("Error reading JSON file.");
    }
  };

  reader.readAsText(file);
};

/**
 * Client prompt for uploading quiz JSON
 */
export const promptFileUpload = (
  setQuizSession: (data: QuizSession | null) => void
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) =>
    handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>, setQuizSession);
  input.click();
};

/**
 * Generate 16-character access ID (client allowed)
 */
export const generateAccessId = () =>
  uuidv4().replaceAll("-", "").slice(0, 16);

/**
 * Send email via API route
 */
export const sendEmailToUser = async (
  email: string,
  hashKey: string,
  accessId: string
) => {
  try {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `Invitation to Access Quiz - ${hashKey}`,
        text: `You've been invited to access the quiz. Use this link: ${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}`,
        html: `<p>You've been invited to access the quiz. Use the following link:</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}">
        ${process.env.NEXT_PUBLIC_BASE_URL}/access/${hashKey}/${accessId}
        </a>`,
      }),
    });

    if (!response.ok) throw new Error("Failed to send email");

    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};