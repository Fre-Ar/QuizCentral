import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer'; // Admin client
import { UserAccount, QuizContext } from '@/engine/session/types';
import { PageNode, QuizSchema } from '@/engine/types/schema';

export async function POST(req: Request) {
  try {
    const { title, creatorId } = await req.json();

    if (!title || !creatorId) {
      return NextResponse.json({ error: "Missing Title or Creator ID" }, { status: 400 });
    }

    // 1. Generate a URL-friendly ID (Slug)
    // "My Cool Quiz" -> "my-cool-quiz-1715000000"
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/(^-|-$)/g, '');    // Trim leading/trailing hyphens
    
    // Append timestamp to ensure uniqueness within the creator's scope for MVP
    const uniqueQuizId = `${slug}-${Date.now()}`;

    const defaultPage: PageNode = {
      id: 'page01',
      title: 'First Page',
      blocks: []

    }

    // 2. Create Default Schema
    const defaultSchema: QuizSchema = {
      id: uniqueQuizId, // The internal schema ID matches the DB ID
      meta: { 
        title: title, 
        description: "New quiz created via Dashboard." 
      },
      config: { 
        navigation_mode: "linear",
        time_limit_seconds: 0
      },
      state: {}, 
      pages: [defaultPage] 
    };

    // 3. Insert into Database
    const { data: newQuiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        creator_id: creatorId,
        id: uniqueQuizId,
        title: title,
        quiz_schema: defaultSchema,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Quiz Creation DB Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // -------------------------------------------------------------
    // 4. Construct Response (Rehydrate Full Context)
    // We need to return a 'QuizContext' object. To do that, we need
    // the UserAccount object of the creator to send back.
    // -------------------------------------------------------------

    // A. Fetch User & Assets
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', creatorId)
      .single();

    if (userError) throw new Error("Could not fetch creator details after quiz creation");

    // B. Fetch Groups
    const { data: groups } = await supabase
      .from('groups')
      .select('*')
      .eq('creator_id', creatorId);

    // C. Reconstruct UserAccount
    const groupsMap: Record<string, any> = {};
    groups?.forEach((g: any) => {
      groupsMap[g.id] = g;
    });

    // Note: We don't necessarily need to fetch the updated list of quizzes 
    // for the UserAccount object inside the *QuizContext* (it's mostly for the dashboard).
    // An empty array is acceptable here for the Context, or we can fetch them.
    
    const creatorAccount: UserAccount = { // Use your UserAccount type here (ensure types match)
      googleId: userRow.google_id,
      email: userRow.email,
      userName: userRow.username,
      createdAt: userRow.created_at,
      styles: userRow.styles || {},
      templates: userRow.templates || {},
      quizzes: [], 
      groups: groupsMap as any // Cast for JSON/Map mismatch (Client util handles revival)
    };

    // 5. Final Response
    const quizContextPayload: QuizContext = { // Use your QuizContext type
      quizId: newQuiz.id,
      quizCreator: creatorAccount,
      quizSchema: newQuiz.quiz_schema,
      groups: [], // No groups assigned to a brand new quiz yet
      openSessions: [],
      submission: []
    };

    return NextResponse.json(quizContextPayload);

  } catch (error: any) {
    console.error("Create Quiz API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}