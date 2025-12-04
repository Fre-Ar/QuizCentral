'use client';

import Link from 'next/link';
import Header from '@/components/header';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';
import { createDefaultQuiz, loadQuiz } from '@/handlers/quiz-handler';
import GoogleLoginButton from "../components/GoogleLoginButton";
import { useGoogleId } from "@/hooks/googleId";

export default function Home() {

  const { setQuizSession } = useQuiz();
  const { googleId, setGoogleId } = useGoogleId();
  
  const router = useRouter()

 /**
 * Wrapper that creates a new quiz session, sets it into page state, and navigates.
 *
 * This centralizes the page-side creation logic in the handler module so callers
 * (like `page.tsx`) only need to pass the callbacks required to update state and
 * navigate.
 */
  const handleCreateQuiz = () => {
    createDefaultQuiz(setQuizSession, (path: string) => router.push(path));
  };

 
  /**
   * Attempts to load an existing quiz session from a cookie and, if confirmed by the user,
   * fetches the quiz data from the server and restores the quiz session in the UI.
   *
   * This mirrors the logic previously in `page.tsx` but keeps the page thin by
   * accepting the minimal callbacks required to update state and navigate.
  */
  const handleLoadQuiz = async () => {
    await loadQuiz(setQuizSession, (path: string) => router.push(path));
  };
  


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="grow flex justify-center">
        <div className="flex flex-col w-full max-w-md border-l border-r border-uni-grey mx-4 lg:mx-0">
          <div className="grow flex flex-col justify-center space-y-4 items-center p-4">

            <Link href="/access">
              <button className="bg-uni-red text-white font-bold py-4 px-8 rounded">Access Quiz</button>
            </Link>
            
              <button className="bg-uni-blue text-white font-bold py-4 px-8 rounded" onClick={handleCreateQuiz}>Create Quiz</button>
            
              <button className="bg-uni-blue text-white font-bold py-4 px-8 rounded" onClick={handleLoadQuiz}>Load Quiz</button>

              {!googleId && <GoogleLoginButton /> }
              
              <Link href="/test">
                <button className="bg-uni-red text-white font-bold py-4 px-8 rounded">Test Features</button>
              </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

