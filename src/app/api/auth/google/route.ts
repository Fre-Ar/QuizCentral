import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
        return NextResponse.json({ error: "Missing Access Token" }, { status: 400 });
    }

    // 1. Verify Token & Get Info directly from Google
    // Using the UserInfo endpoint is the safest way to validate an access token
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return NextResponse.json({ error: "Invalid Google Token" }, { status: 401 });
    }

    const googleData = await googleRes.json();
    const { sub: googleId, email, name } = googleData;

    const user = {
      name: name,
      email: email,
      googleId: googleId
    }

    // 2. DB Interaction: Create or Get User
    // We use .select() to return the full row (including styles/templates if they exist)
    const { data: userRow, error } = await supabase
      .from("users")
      .upsert(
        {
          google_id: user.googleId,
          email: user.email,
          username: user.name,
          // We don't overwrite styles/templates here to preserve existing data
          // Supabase upsert ignores columns not specified if the row exists,
          // BUT to be safe in an upsert, we usually rely on default values for new rows.
        },
        { onConflict: "google_id" }
      )
      .select() // Return the fresh row
      .single();

    if (error) {
      console.error("Supabase Login Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Fetch Metadata (Quizzes) 
    // The 'users' table doesn't have the quiz list array column (it's relational),
    // so we fetch it quickly here to satisfy the UserAccount interface.
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("creator_id", user.googleId);

    // 4. Construct Final User Object
    const fullUser = {
      ...userRow,
      styles: userRow.styles || {},       // Handle JSONB -> Object
      templates: userRow.templates || {}, // Handle JSONB -> Object
      groups: {}, // Load groups lazily later or fetch here if critical
      quizzes: quizzes || []
    };

    return NextResponse.json({
      message: "Google Login Success",
      user: fullUser,
    });
  } catch (error: any) {
    console.error("SERVER ERROR DETAIL:", error); 
    return NextResponse.json({ error: "Internal Server Error", details: error.message || String(error) }, { status: 500 });
  }
}
