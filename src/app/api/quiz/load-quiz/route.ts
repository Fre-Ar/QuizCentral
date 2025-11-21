import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handles POST requests to load a quiz by its hash key.
 *
 * Expects a JSON body with the shape: { hashKey: string }.
 *
 * Behavior:
 * - Validates that `hashKey` is present in the request body. If missing, responds with 400.
 * - Queries the `quizzes` table (via Supabase) for a row whose `hash` equals the provided `hashKey`, selecting the `quiz_data` column.
 * - If a matching row is found, responds with 200 and a JSON payload containing the quiz data.
 * - If the query fails or no data is returned, responds with 500 and an error message.
 *
 * @param request - The incoming Request object. The request body must be valid JSON and include a `hashKey` string.
 * @returns Promise<Response> - A JSON response with one of the following shapes:
 *   - 200: { quizData: any } — the quiz payload retrieved from the database.
 *   - 400: { error: 'Missing required parameters' } — when `hashKey` is not provided.
 *   - 500: { error: string } — when a database or unexpected error occurs.
 *
 * @remarks
 * - The implementation relies on a Supabase client available in the module scope. Ensure the client is initialized before invoking this handler.
 * - Only the `quiz_data` column is selected from the `quizzes` table; additional fields are not returned.
 * - Consider adding stricter validation for `hashKey` (e.g., type/format checks) and authentication/authorization if quizzes are not public.
 * - Errors are converted into JSON responses and are not re-thrown to the caller.
 *
 * @example
 * // POST /api/quiz/load-quiz
 * // Request body:
 * // { "hashKey": "abc123" }
 *
 * @throws Nothing is thrown to the caller; internal errors are caught and returned as JSON error responses.
 */
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