import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer"; // Ensure this uses Service Role Key

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
        return NextResponse.json({ error: "Missing Access Token" }, { status: 400 });
    }

    // 1. Verify Token with Google
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return NextResponse.json({ error: "Invalid Google Token" }, { status: 401 });
    }

    const googleData = await googleRes.json();
    const { sub: googleId, email, name } = googleData;

    // 2. Create or Update User (The "Populate" step)
    // We strictly handle the User identity here. 
    // We do NOT fetch quizzes/groups here.
    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          google_id: googleId,
          email: email,
          username: name,
          // Note: We rely on default empty JSONB for styles/templates for new users
        },
        { onConflict: "google_id" }
      );

    if (upsertError) {
      console.error("Supabase Upsert Error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 3. Return only the ID. The client will use this to fetch the full profile.
    return NextResponse.json({
      message: "Identity Verified",
      googleId: googleId,
    });

  } catch (error: any) {
    console.error("Auth API Error:", error); 
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
