import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ensure this is a server-side supabase client

export async function POST(request: Request) {
    const { quizSession, launchedGroup } = await request.json();

    // Insert the quiz into the quizzes table if it doesn't already exist
    const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .upsert({ hash: quizSession.hash, quiz_data: quizSession }, { onConflict: 'hash' })
    .select('id');

    if (quizError) return NextResponse.json({ error: 'Error saving quiz' }, { status: 500 });

    const quizId = quizData[0].id;

    // Insert the launched group into the groups table
    const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([{
      name: launchedGroup.name,
      permission: launchedGroup.permission,
      settings: launchedGroup.settings,
      quiz_id: quizId,
    }])
    .select('id');

    if (groupError) return NextResponse.json({ error: 'Error saving group' }, { status: 500 });

    const groupDbId = groupData[0].id;

    for(const user of launchedGroup.emails){

        const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert(
          {
            quiz_hash: quizSession.hash,
            access_id: user.accessId,
            group_id: groupDbId,
            email: user.email,
          },
          { onConflict: 'quiz_hash,access_id' }  // Use composite primary key columns
        ).select('id');

        if (userError) return NextResponse.json({ error: 'Error saving user' }, { status: 500 });
    }

    return NextResponse.json({ message: `Group "${launchedGroup.name}" and associated users saved successfully!` });
}
