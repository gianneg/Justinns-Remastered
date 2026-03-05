import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const lodging_id = Number(body.lodging_id)
    const rating_score = Number(body.rating_score)
    const review_title = String(body.review_title ?? "").trim()
    const review_comment = String(body.review_comment ?? "").trim()

    if (!lodging_id || rating_score < 1 || rating_score > 5 || !review_title || !review_comment) {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const user_id = body.user_id
    if (!user_id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 })
    }

    const { error } = await supabase.from("review").insert({
      user_id,
      lodging_id,
      rating_score,
      review_comment,
      review_title,
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 })
  }
}