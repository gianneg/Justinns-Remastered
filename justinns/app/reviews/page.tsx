"use client"

import Header from "@/components/Header"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getMyReviews, type MyReviewRow } from "@/lib/queries"

export default function ReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<MyReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError("")

      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace("/login")
        return
      }

      try {
        const rows = await getMyReviews()
        if (!cancelled) setReviews(rows)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load reviews.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <>
      <Header />

      <main className="max-w-[800px] mx-auto mt-12 p-5 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-center mb-6 text-black">
          My Reviews
        </h1>

        {loading && <p className="text-sm">Loading...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r, idx) => (
                  <div key={`${r.Review_Title}-${idx}`} className="bg-slate-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-black">
                      {r.Lodging_Name}
                    </h2>

                    <p className="text-sm text-black mt-1">
                      <span className="font-semibold">Title:</span> {r.Review_Title}
                    </p>

                    <p className="text-sm text-black">
                      <span className="font-semibold">Rating:</span> {r.Rating_Score}/5
                    </p>

                    <p className="text-sm text-black">
                      <span className="font-semibold">Review:</span> {r.Review_Comment}
                    </p>

                    <p className="text-sm text-black">
                      <span className="font-semibold">Reviewed on:</span>{" "}
                      {new Date(r.Created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black">
                No reviews found. Write your first review!
              </p>
            )}

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-block px-5 py-2 bg-black text-white rounded hover:bg-gray-200 hover:text-black"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}