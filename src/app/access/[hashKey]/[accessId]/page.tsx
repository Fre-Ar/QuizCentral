'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { parseQuizBlock } from '@/lib/utils';

interface QuizPageProps {
  params: {
    hashKey: string;
    accessId: string;
  };
}

const AccessQuizPage: React.FC<QuizPageProps> = ({ params }) => {
    const { hashKey, accessId } = params;
    const router = useRouter();

    const [quizData, setQuizData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
     // Function to parse the quiz data
  const parseQuizDisplay = (json: any): React.JSX.Element => {
    if (
    json &&
    typeof json === 'object' &&
    typeof json.hash === 'string' &&
    typeof json.quiz === 'object' &&
    Array.isArray(json.groups) &&
    Array.isArray(json.custom) &&
    typeof json.settings === 'object'
    ) {
    try {
        const parsedQuiz = parseQuizBlock(json.quiz).asDisplay(); // Parse the main quiz block
        return parsedQuiz;
    } catch (error) {
        console.error('Error parsing quiz blocks:', error);
        return <div/>;
    }
    }
    return <div/>;
};
    

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

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />     
            <div className="flex-grow flex center-fix overflow-auto text-nowrap">
              <main className="flex-grow flex center-fix overflow-auto text-nowrap"
              style={{
                width: `50%`,
              }}>
                {parseQuizDisplay(quizData)}
              </main>
            </div>
        </div>
    );
};

export default AccessQuizPage;