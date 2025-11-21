import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handle POST requests to retrieve quiz data for an authorized user.
 *
 * Expects a JSON body with the following shape:
 * {
 *   "hashKey": string,   // Unique quiz hash
 *   "accessId": string   // User-specific access identifier
 * }
 *
 * Behavior:
 * - Validates that both `hashKey` and `accessId` are provided; returns 400 if missing.
 * - Verifies that a user exists in the `users` table with the provided `accessId` and `quiz_hash`; returns 403 if no matching user is found (unauthorized).
 * - Fetches the `quiz_data` from the `quizzes` table using the provided `hashKey`; returns 404 if the quiz is not found.
 * - On success, returns a 200 response with a JSON body containing the quiz data: { quizData }.
 * - Any unexpected errors are caught and result in a 500 response with a generic error message.
 *
 * Security:
 * - This endpoint enforces that the `accessId` must match the `quiz_hash` on the `users` row to prevent unauthorized access.
 *
 * Database expectations:
 * - `users` table contains at least: { access_id, quiz_hash }
 * - `quizzes` table contains at least: { hash, quiz_data }
 *
 * @param request - The incoming Request object. The handler will call request.json() to extract { hashKey, accessId }.
 * @returns A Promise resolving to a NextResponse-compatible Response object:
 *   - 200: { quizData } on success
 *   - 400: { error: 'Missing required parameters' } when inputs are missing
 *   - 403: { error: 'Invalid access ID or unauthorized access' } when user validation fails
 *   - 404: { error: 'Quiz not found' } when quiz lookup fails
 *   - 500: { error: 'An error occurred while fetching the quiz data' } on unexpected errors
 *
 * @example
 * // Client request example
 * fetch('/api/quiz/get-quiz', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ hashKey: 'abc123', accessId: 'user-xyz' })
 * })
 * .then(res => res.json())
 * .then(data => {
 *   // handle { quizData } or { error }
 * });
 *
 * @remarks
 * - The implementation relies on a configured `supabase` client and `NextResponse` helper.
 * - Errors from Supabase are translated into appropriate HTTP responses; no raw DB errors are returned to the client.
 */
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