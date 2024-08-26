import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const { hashKey } = await request.json();
  
    if (!hashKey) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
  
    try {
      // Fetch the quiz data using the hashKey directly from quizzes table
      const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('quiz_data')
      .eq('hash', hashKey)
      .single();
  
      if (quizError || !quizData) {
        return NextResponse.json({ error: 'Failed to load quiz. Please try again.' }, { status: 500 });
      }
  
      return NextResponse.json({ quizData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred while fetching the quiz data' }, { status: 500 });

    }
  }