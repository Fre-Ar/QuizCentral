import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer'; 

export async function GET(
  request: Request,
  { params }: { params: { googleId: string } }
) {
  const { googleId } = await params; 

  // 1. Fetch User Profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 2. Fetch Quizzes (Metadata)
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
    .eq('creator_id', googleId);

  if (groupError) {
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }

  // 4. Transform Groups Array -> Plain Object
  // We must send a Plain Object over JSON. The Client will turn this back into a Map.
  const groupsObject: Record<string, any> = {};
  groups.forEach((g: any) => {
    groupsObject[g.id] = {
      id: g.id,
      name: g.name,
      emails: g.emails, // JSONB array from DB
      settings: g.settings // JSONB object from DB
    };
  });

  // 5. Construct Payload
  const responsePayload = {
    googleId: user.google_id,
    email: user.email,
    userName: user.username,
    createdAt: user.created_at,
    styles: user.styles || {},       
    templates: user.templates || {}, 
    quizzes: quizzes || [],
    groups: groupsObject // Send Object, not Map as these can't be sent in JSON
  };

  return NextResponse.json(responsePayload);
}