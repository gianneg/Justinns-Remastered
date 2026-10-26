import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { userId, firstName, lastName, phone } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 },
            );
        }

        // Use service role key for server-side operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const { error } = await supabase.from("user").insert({
            auth_id: userId,
            firstname: firstName,
            lastname: lastName,
            phone_number: phone,
            // new accounts are always regular users; admins are set in the database
            is_admin: false,
            profile_image: null,
        });

        if (error) {
            console.error("Database insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Signup API error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
