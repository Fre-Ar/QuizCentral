import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ensure this is a server-side supabase client

/**
 * Handles a POST request to save a quiz into the database.
 *
 * Expects the request body to be JSON containing a `quizJson` property:
 * { quizJson: { hash: string, settings: { quizSettings: { title: string } }, ... } }.
 *
 * The function performs an upsert into the `quizzes` table using `quizJson.hash` as the conflict key
 * and selects the resulting row `id`. If the upsert fails, a 500 JSON response with an error message
 * is returned. On success, a JSON response with a success message including the quiz title is returned.
 *
 * @param request - The incoming Request object. Its JSON body must contain a `quizJson` payload.
 * @returns A NextResponse JSON response:
 *   - Success (200): { message: string } confirming the quiz was saved.
 *   - Failure (500): { error: string } when saving the quiz fails.
 *
 * @remarks
 * - This handler relies on an available `supabase` client and `NextResponse` from Next.js runtime.
 * - The upsert uses `{ onConflict: 'hash' }` to avoid duplicate quizzes; the inserted/updated row id is selected.
 * - Input validation for the full shape of `quizJson` is not performed here; callers should ensure the payload is well-formed.
 *
 * @example
 * // POST body:
 * // { "quizJson": { "hash": "abc123", "settings": { "quizSettings": { "title": "My Quiz" } }, ... } }
 */
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
