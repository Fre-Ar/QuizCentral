import React, { useEffect, useState } from "react";
import { useSessionState } from "@/engine/hooks/useGlobalState";
import { BlockFactory } from "@/engine/blocks/BlockFactory";
import { useRouter} from "next/navigation";
import { useUserContext } from "@/engine/hooks/useUserContext";
import { fetchQuizContext } from "@/lib/db-utils";
import { QuizContext } from "@/engine/session/types";
import { QuizProvider, useQuizContext } from "@/engine/hooks/useQuizContext";
import { useDragging } from '@/hooks/resizing';
import Header from '@/components/header';
import NavMenu from "@/components/NavHeader";
import DragHandle from '@/components/drag-handle';
import SidePanel from '@/components/SidePanel';

// --- THE EDITOR ---

interface EditorProps {
  tab: string;
  quizParamId: string;
}

export const QuizEditor: React.FC<EditorProps>  = ({tab, quizParamId}) => {
  // ===============
  // EDITOR CONTEXT
  // ===============
  const { engine } = useQuizContext();
  
  const [quizContext, setQuizContext] = useState<QuizContext | null>(null);
  const { user, isLoading: isUserLoading } = useUserContext();
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Subscribe to Session State (Navigation)
  const session = useSessionState((s) => s);

  // The engine has the "Real" schema with generated IDs.
  const schema = engine.getSchema();

  // Find Active Page
  const activePage = schema.pages.find(p => p.id === session.currentStepId);

  // ===============
  // EDITOR VIEW
  // ===============

  const { leftSidebarWidth, rightSidebarWidth, selectedDivId, mainRef, handleMouseDown } = useDragging();

  // 1. Fetch Data on Mount (or when User loads)
  useEffect(() => {
    const loadQuiz = async () => {
      // Wait for user auth to settle
      if (isUserLoading) return;
      
      if (!user) {
        // Redirect to login if trying to access protected route without auth
        router.push("/"); 
        return;
      }

      const quizId = quizParamId as string;
      if (!quizId) return;

      try {
        setIsQuizLoading(true);
        // Fetch fresh data from DB
        const data = await fetchQuizContext(user.googleId, quizId);
        
        if (!data) throw new Error("Quiz not found or access denied");
        
        setQuizContext(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load quiz");
      } finally {
        setIsQuizLoading(false);
      }
    };

    loadQuiz();
  }, [user, isUserLoading, quizParamId, router]);


  // 2. Loading State
  if (isUserLoading || isQuizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

   // 3. Error State
  if (error || !quizContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Quiz</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!activePage) return <div>Quiz Completed or Invalid State</div>;

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />

      <NavMenu tab={tab} id={quizContext.quizId} />
      <div className="flex grow overflow-hidden">

        <SidePanel Width={`${leftSidebarWidth}%`} Tab='blocks' Position='left'
        Selected={selectedDivId}/>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main ref={mainRef} className="grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}% - ${rightSidebarWidth}% - 10px)`, // 10px for the resizers
          }}>

            {/* The Engine */}
            <QuizProvider 
              schema={quizContext.quizSchema} 
              styleRegistry={user!.styles}
              templateRegistry={user!.templates}
            >
              <div className="flex gap-8 p-8 max-w-6xl mx-auto">
                <div className="flex-1 justify-items-center bg-black p-8 rounded-xl shadow-lg border border-gray-100">
                  <h1 className="text-2xl font-bold mb-6">{schema.meta.title}</h1>
                  
                  <div className="space-y-6">
                    {activePage.blocks.map((block) => (
                      <BlockFactory key={block.id} block={block} />
                    ))}
                  </div>
                </div>
                
              </div>
            </QuizProvider>

        </main>


        <DragHandle onMouseDown={() => handleMouseDown('right')}/>

        <SidePanel Width={`${rightSidebarWidth}%`} Tab='settings' Position='right' 
        Selected={selectedDivId}/>
      </div>   
    </div> 

  );
};