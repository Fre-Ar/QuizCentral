import { QuizProvider, useQuizContext } from "@/engine/hooks/useQuizContext";
import { useSessionState } from "@/engine/hooks/useGlobalState";
import { BlockFactory } from "@/engine/blocks/BlockFactory";
import { MOCK_SCHEMA }  from "@/engine/blocks/MockQuiz";

// --- THE EDITOR ---

export const QuizEditor = () => {
  const { engine } = useQuizContext();
  
  // Subscribe to Session State (Navigation)
  const session = useSessionState((s) => s);

  // The engine has the "Real" schema with generated IDs.
  const schema = engine.getSchema();

  // Find Active Page
  const activePage = schema.pages.find(p => p.id === session.currentStepId);

  if (!activePage) return <div>Quiz Completed or Invalid State</div>;

  return (
    <div className="flex gap-8 p-8 max-w-6xl mx-auto">
      {/* LEFT: THE FORM */}
      <div className="flex-1 justify-items-center bg-black p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-6">{schema.meta.title}</h1>
        
        <div className="space-y-6">
          {activePage.blocks.map((block) => (
             <BlockFactory key={block.id} block={block} />
          ))}
        </div>
      </div>

      {/* RIGHT: THE BRAIN (Debug) */}
      <div className="w-96 bg-black text-green-500 border border-gray-100 p-6 rounded-xl font-mono text-xs overflow-auto h-[80vh]">
        <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Engine State</h3>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  );
};