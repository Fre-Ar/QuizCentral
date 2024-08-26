import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const { hashKey, accessId } = await request.json();
  
    if (!hashKey || !accessId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
  
    try {
      // Verify if the accessId is valid for the given hashKey in the users table
      const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('access_id', accessId)
      .eq('quiz_hash', hashKey)
      .single();
  
      if (userError || !userData) {
        return NextResponse.json({ error: 'Invalid access ID or unauthorized access' }, { status: 403 });
      }
  
  
      // Fetch the quiz data using the hashKey directly from quizzes table
      const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('quiz_data')
      .eq('hash', hashKey)
      .single();
  
      if (quizError || !quizData) {
        
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
  
      return NextResponse.json({ quizData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred while fetching the quiz data' }, { status: 500 });

    }
  }