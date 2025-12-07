import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 
import { QuizContext, UserAccount } from "@/engine/session/types";

// Helper to convert Maps (Registries) to Plain Objects for JSONB storage
const mapToObj = (map: Map<any, any> | undefined) => {
  if (!map || !(map instanceof Map)) return {};
  return Object.fromEntries(map);
};

export async function POST(request: Request) {
  try {
    const { quizJson: quizCtx } = (await request.json()) as { quizJson: QuizContext };
    const creator = quizCtx.quizCreator;

    // ---------------------------------------------------------
    // 1. SAVE USER & ASSETS (Styles, Templates)
    // ---------------------------------------------------------
    // We strictly update the registries here to ensure the user's latest
    // custom styles/templates are available in the DB.
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        google_id: creator.googleId,
        email: creator.email,
        username: creator.userName,
        
        // Convert Maps to JSON Objects
        styles: mapToObj(creator.styles),
        templates: mapToObj(creator.templates),
        
        // Note: We don't save creator.quizzes metadata list here; 
        // that is derived from the 'quizzes' table queries.
      }, { onConflict: 'google_id' });

    if (userError) throw new Error(`User Save Failed: ${userError.message}`);


    // ---------------------------------------------------------
    // 2. SAVE GROUP DEFINITIONS
    // ---------------------------------------------------------
    // We iterate through the User's GroupRegistry to ensure all group definitions exist.
    if (creator.groups && creator.groups.size > 0) {
      const groupsPayload = Array.from(creator.groups.values()).map(group => ({
        creator_id: creator.googleId,
        id: group.id, // Human readable ID
        name: group.name,
        emails: group.emails, // JSONB array of InvitedUser
        settings: group.settings // JSONB object
      }));

      const { error: groupError } = await supabase
        .from('groups')
        .upsert(groupsPayload, { onConflict: 'creator_id, id' });

      if (groupError) throw new Error(`Group Save Failed: ${groupError.message}`);
    }


    // ---------------------------------------------------------
    // 3. SAVE THE QUIZ
    // ---------------------------------------------------------
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .upsert({
        creator_id: creator.googleId, 
        id: quizCtx.quizId,
        title: quizCtx.quizSchema.meta.title,
        quiz_schema: quizCtx.quizSchema,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'creator_id, id' 
      })
      .select()
      .single();

    if (quizError) throw new Error(`Quiz Save Failed: ${quizError.message}`);


    // ---------------------------------------------------------
    // 4. LINK QUIZ TO GROUPS (Junction Table)
    // ---------------------------------------------------------
    // quizCtx.groups contains the array of groups assigned to *this* quiz.
    if (quizCtx.groups && quizCtx.groups.length > 0) {
      
      // First, clean existing links for this quiz to avoid stale associations
      // (Optional: depending on your logic, you might want to keep history, 
      // but usually 'Save' implies 'Set state to exactly this').
      await supabase
        .from('quiz_groups')
        .delete()
        .match({ quiz_creator_id: creator.googleId, quiz_id: quizCtx.quizId });

      // Insert new links
      const linksPayload = quizCtx.groups.map(group => ({
        // Quiz Key
        quiz_creator_id: creator.googleId,
        quiz_id: quizCtx.quizId,
        
        // Group Key 
        // (Assuming the creator of the quiz is also the owner of the group for this MVP)
        group_creator_id: creator.googleId, 
        group_id: group.id 
      }));

      const { error: linkError } = await supabase
        .from('quiz_groups')
        .insert(linksPayload);

      if (linkError) throw new Error(`Quiz-Group Link Failed: ${linkError.message}`);
    }

    return NextResponse.json({ 
      message: `Quiz "${quizCtx.quizSchema.meta.title}" and all assets saved successfully!`,
      data: quizData
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}