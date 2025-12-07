import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Group } from '@/engine/session/types';

export async function GET(
  request: Request,
  { params }: { params: { googleId: string } }
) {
  const param = await params;
  const googleId = param.googleId;

  // 1. Fetch User Profile & Assets
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 2. Fetch Quiz Metadata (List of quizzes owned by user)
  const { data: quizzes, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title')
    .eq('creator_id', googleId);

  if (quizError) {
    return NextResponse.json({ error: 'Failed to load quizzes' }, { status: 500 });
  }

  // 3. Fetch Groups
  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('creator_id', user.googleId);

  if (groupError) {
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }

  // 4. Construct Response (Groups as Object Map for JSON transfer)
  const groupsMap: Map<string, Group> = new Map();
  groups.forEach((g: any) => {
    groupsMap.set(
      g.id,
      {
        id: g.id, // id can be human readable as it is uniquely identified by its user creator and group id
        name: g.name, 
        emails: g.emails,
        settings: g.settings
      });
  });

  const responsePayload = {
    googleId: user.google_id,
    email: user.email,
    userName: user.username,
    createdAt: user.created_at,
    styles: user.styles || {},       // JSONB -> Object
    templates: user.templates || {}, // JSONB -> Object
    quizzes: quizzes || [],
    groups: groupsMap                // Array -> Object Map
  };

  return NextResponse.json(responsePayload);
}