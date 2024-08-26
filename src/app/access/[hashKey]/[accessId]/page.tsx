'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/header';

import {InputBlock} from '@/components/quiz_components/variables/input-comp';
import {TextBlock} from '@/components/quiz_components/info/text-comp';
import { ButtonBlock } from '@/components/quiz_components/variables/button-comp';
import { ContainerBlock } from '@/components/quiz_components/container-comp';
import { QuizBlock } from '@/components/quiz_components/quiz-comp';

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

        // Function to identify the type of QuizBlock and instantiate it accordingly
    const parseQuizBlock = (block: any): QuizBlock  => {
        if ('children' in block && Array.isArray(block.children)) {
        // Recursively parse children
        const children = block.children.map(parseQuizBlock);
        return new ContainerBlock(block.id, block.style || '', block.rows || 1, block.columns || 1, children);
        } else if (block.id === 'submit') {
        return new ButtonBlock(block.id, block.style || '', block.text || '');
        } else if ('text' in block && typeof block.text === 'string') {
        return new TextBlock(block.id, block.style || '', block.font || '', block.text);
        } else if ('def' in block && typeof block.def === 'string') {
        return new InputBlock(block.id, block.style || '', block.def, block.placeholder || '', block.font || '');
        }  else {
        throw new Error('Unknown block type');
        }
    };
    
    // Function to parse the quiz data
    const parseQuizData = (json: any): React.JSX.Element => {
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
                // Verify if the accessId is valid for the given hashKey in the users table
                const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('access_id', accessId)
                .eq('quiz_hash', hashKey)
                .single();

                if (userError || !userData) {
                setError('Invalid access ID or unauthorized access');
                setLoading(false);
                return;
                }

                // Fetch the quiz data using the hashKey directly from quizzes table
                const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .select('quiz_data')
                .eq('hash', hashKey)
                .single();

                if (quizError || !quizData) {
                setError('Quiz not found');
                setLoading(false);
                return;
                }

                setQuizData(quizData.quiz_data);
                setLoading(false);
            } catch (err) {
                setError('An error occurred while fetching the quiz data');
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
            <main className="flex-grow flex justify-center">
                <div className="flex flex-col w-full max-w-md border-l border-r border-uni-grey mx-4 lg:mx-0">
                    <div className="flex-grow flex flex-col justify-center space-y-4 items-center p-4">
                        {parseQuizData(quizData)}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AccessQuizPage;