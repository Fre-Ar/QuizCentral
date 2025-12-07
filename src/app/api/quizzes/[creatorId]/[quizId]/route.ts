import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: { creatorId: string; quizId: string } }
) {
  const { creatorId, quizId } = await params;

  // 1. Fetch Quiz Definition
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .match({ creator_id: creatorId, id: quizId })
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // 2. Fetch Creator (UserAccount) - Reusing logic logic or internal fetch?
  // Ideally, we do a DB call here to be fast.
  // We need the creator's Styles/Templates for the Engine to render the quiz.
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', creatorId)
    .single();

  if (userError) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  // 2b. Fetch Creator's Groups (Need for UserAccount completeness)
  const { data: userGroups } = await supabase
    .from('groups')
    .select('*')
    .eq('creator_id', creatorId);

  // 3. Fetch Groups Assigned to THIS Quiz (Join Table)
  // We want the actual Group data for groups linked to this quiz
  const { data: linkedGroups, error: linkError } = await supabase
    .from('quiz_groups')
    .select(`
      group_id,
      groups:group_id ( * )
    `)
    .match({ quiz_creator_id: creatorId, quiz_id: quizId });

  // 4. Construct UserAccount Object (Creator)
  const groupsMap: Record<string, any> = {};
  userGroups?.forEach((g: any) => groupsMap[g.id] = g);

  const creatorAccount = {
    googleId: user.google_id,
    email: user.email,
    userName: user.username,
    createdAt: user.created_at,
    styles: user.styles || {},
    templates: user.templates || {},
    quizzes: [], // Not strictly needed for Context, can be empty
    groups: groupsMap
  };

  // 5. Construct Groups List (Assigned to this quiz)
  // Extract the joined group data
  const assignedGroups = linkedGroups?.map((item: any) => item.groups) || [];

  // 6. Final Payload
  const quizContextPayload = {
    quizId: quiz.id,
    quizCreator: creatorAccount,
    quizSchema: quiz.quiz_schema, // The JSON Schema
    groups: assignedGroups,       // Array of Group objects
    openSessions: [],             // Init empty
    submission: []                // Init empty
  };

  return NextResponse.json(quizContextPayload);
}