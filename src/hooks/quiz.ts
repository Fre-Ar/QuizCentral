import { useRouter } from 'next/dist/client/components/navigation';
import { useState, useEffect } from 'react';
import { useQuiz as uq } from '@/components/session-context';

export function useQuiz(hashKey: string, accessId: string) {
    const [quizData, setQuizData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const response = await fetch('/api/quiz/get-quiz', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({hashKey: hashKey, accessId: accessId }),
                  });
                const result = await response.json();
                  
              if (result.error) {
                setError(result.error || 'An error occurred while fetching the quiz data');
              } else {
                setQuizData(result.quizData.quiz_data);
              }
            } catch (err) {
              setError('An error occurred while fetching the quiz data');
            } finally {
              setLoading(false);
            }
          };

        fetchQuizData();
    }, [hashKey, accessId]);

return { quizData, loading, error };
}

export function useQuizSession() {
  const { quizSession, setQuizSession } = uq();
  const router = useRouter()
  
      useEffect(() => {
        // If quizData doesn't exist, redirect to the homepage
        if (!quizSession) {
          router.push('/');
        }
      }, [quizSession, router]);
  return { quizSession, setQuizSession};
}