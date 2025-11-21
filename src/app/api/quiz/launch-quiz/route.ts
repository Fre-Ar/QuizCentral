import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Ensure this is a server-side supabase client

/**
 * HTTP POST handler that launches a quiz by saving/updating the quiz record,
 * creating a group, and upserting associated users into the database (Supabase).
 *
 * Expected request body (JSON):
 * {
 *   "quizSession": {
 *     "hash": string,           // unique quiz identifier used as conflict key
 *     ...                       // other serializable quiz/session data stored in quizzes.quiz_data
 *   },
 *   "launchedGroup": {
 *     "name": string,           // group display name
 *     "permission": any,        // group permission metadata (type depends on your schema)
 *     "settings": object,       // group settings object saved to groups.settings
 *     "emails": [               // list of users to add to the group
 *       {
 *         "accessId": string,   // user's access identifier (used in composite conflict)
 *         "email": string       // user's email address
 *       },
 *       ...
 *     ]
 *   }
 * }
 *
 * Behavior:
 * - Upserts the quiz into the "quizzes" table using quizSession.hash as the conflict key
 *   and stores the full quizSession as quiz_data. Selects the resulting quiz id.
 * - Inserts a new row into the "groups" table with the provided name, permission,
 *   settings and the quiz id returned from the previous step. Selects the resulting group id.
 * - Iterates over launchedGroup.emails and upserts each user into the "users" table.
 *   Each user upsert sets quiz_hash, access_id, group_id and email, using the composite
 *   conflict on (quiz_hash, access_id). For each upsert the inserted/updated id is selected.
 *
 * Responses:
 * - On success: returns a JSON success message (200 OK) confirming the group and users were saved.
 *   Example: { "message": "Group \"Team A\" and associated users saved successfully!" }
 * - On any database error during quiz/group/user operations: returns JSON error with status 500.
 *   Example: { "error": "Error saving quiz" } or { "error": "Error saving group" } or { "error": "Error saving user" }
 *
 * Important notes / caveats:
 * - Operations are executed sequentially and are not wrapped in an atomic transaction.
 *   If an error occurs after the quiz or group has been inserted, partial writes may remain.
 *   Consider using a database transaction to ensure atomicity if that behavior is undesirable.
 * - The function assumes the presence of a configured Supabase client (`supabase`) and Next.js
 *   NextResponse helpers in scope.
 * - Be mindful of input validation and sanitation; the handler currently trusts the request body shape.
 *
 * @param request - The incoming Request object. The JSON body must contain `quizSession` and `launchedGroup`
 *                  as described above.
 * @returns A NextResponse-like JSON response. On success, a success message (200). On error, an error object (500).
 *
 * @example
 * // Request (POST)
 * // body:
 * {
 *   "quizSession": { "hash": "abc123", "title": "Intro to AI", "questions": [...] },
 *   "launchedGroup": {
 *     "name": "Section 1",
 *     "permission": "student",
 *     "settings": { "timeLimit": 30 },
 *     "emails": [
 *       { "accessId": "u1", "email": "student1@example.com" },
 *       { "accessId": "u2", "email": "student2@example.com" }
 *     ]
 *   }
 * }
 *
 * @remarks
 * - Consider adding explicit validation and more specific error messages to aid debugging.
 */
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
