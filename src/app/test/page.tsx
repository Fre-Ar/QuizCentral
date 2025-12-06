"use client";

import { QuizProvider} from "@/engine/hooks/useQuizContext";
import { MOCK_SCHEMA, MOCK_USER_STYLES, MOCK_USER_TEMPLATES }  from "@/engine/blocks/MockQuiz";
import { QuizRenderer }  from "@/engine/core/Renderer";
import Header from '@/components/header';
import { LogicEvaluator } from "@/engine/core/LogicEvaluator";

export default function TestPage() {
  return (
    <QuizProvider schema={MOCK_SCHEMA} styleRegistry={MOCK_USER_STYLES} templateRegistry={MOCK_USER_TEMPLATES}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="grow flex justify-center">
          <div className="flex flex-col min-w-full border-l border-r border-uni-grey mx-4 lg:mx-0">
            <QuizRenderer />
          </div>
        </main>
      </div>
    </QuizProvider>
  );
}