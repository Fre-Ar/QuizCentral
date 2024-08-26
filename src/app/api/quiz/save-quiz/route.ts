import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ensure this is a server-side supabase client

export async function POST(request: Request) {
    const { quizJson } = await request.json();

    // Insert the quiz into the quizzes table if it doesn't already exist
    const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .upsert({ hash: quizJson.hash, quiz_data: quizJson }, { onConflict: 'hash' })
    .select('id');

    if (quizError) {
        return NextResponse.json({ error: 'Error saving quiz' }, { status: 500 });
    }

    return NextResponse.json({ message: `Quiz "${quizJson.settings.quizSettings.title}" saved successfully!` });
}
