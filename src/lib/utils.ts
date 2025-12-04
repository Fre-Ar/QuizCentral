"use server";

import { QuizBlock } from "@/components/quiz_components/quiz-comp";
import { ContainerBlock } from "@/components/quiz_components/container-comp";
import { TextBlock } from "@/components/quiz_components/info/text-comp";
import { ButtonBlock } from "@/components/quiz_components/variables/button-comp";
import { InputBlock } from "@/components/quiz_components/variables/input-comp";
import { QuizSession } from "@/components/session-context";
import { types, VarBlock } from "@/components/quiz_components/variables/var-comp";

/**
 * Parse a raw block object → QuizBlock instance
 */
export const parseQuizBlock = (block: any): QuizBlock => {
  if ("children" in block && Array.isArray(block.children)) {
    const children = block.children.map(parseQuizBlock);
    return new ContainerBlock(
      block.id,
      block.style || "",
      block.rows || 1,
      block.columns || 1,
      children,
      block.hidden || false
    );
  }

  if (block.id === "submit") {
    return new ButtonBlock(
      block.id,
      block.style || "",
      block.text || "",
      block.hidden || false
    );
  }

  if (
    "type" in block &&
    typeof block.type === "string" &&
    (types.includes(block.type) || block.type === "")
  ) {
    return new VarBlock(
      block.id,
      block.type || "button",
      block.style || "",
      block.value || "",
      block.name || "",
      block.options || [],
      block.maxlength,
      block.pattern || "",
      block.placeholder || "",
      block.min,
      block.max,
      block.step,
      block.width,
      block.height,
      block.required || false,
      block.disabled || false,
      block.readonly || false,
      block.tooltip || "",
      block.central || false,
      block.neutral || false,
      block.incomplete || false,
      block.hidden || false
    );
  }

  if ("text" in block && typeof block.text === "string") {
    return new TextBlock(
      block.id,
      block.style || "",
      block.font || "",
      block.text,
      block.hidden || false
    );
  }

  if ("def" in block && typeof block.def === "string") {
    return new InputBlock(
      block.id,
      block.style || "",
      block.def,
      block.placeholder || "",
      block.font || "",
      block.hidden || false
    );
  }

  throw new Error("Unknown block type");
};

/**
 * Parse + validate JSON → QuizSession
 */
export const parseQuizData = (json: any): QuizSession | null => {
  if (
    json &&
    typeof json === "object" &&
    typeof json.hash === "string" &&
    typeof json.quiz === "object" &&
    Array.isArray(json.groups) &&
    Array.isArray(json.custom) &&
    typeof json.settings === "object"
  ) {
    try {
      const parsedQuiz = parseQuizBlock(json.quiz);
      return { ...json, quiz: parsedQuiz };
    } catch (err) {
      console.error("Error parsing quiz blocks:", err);
      return null;
    }
  }

  return null;
};
