"use client"

import Header from "@/components/Header"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getLodgingById } from "@/lib/queries"

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-3xl select-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={n <= value ? "text-yellow-400" : "text-slate-300"}
          aria-label={`Rate ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function WriteReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const lodgingId = useMemo(() => {
    const raw = searchParams.get("lodging_id")
    return raw ? Number(raw) : NaN
  }, [searchParams])

  const [lodgingName, setLodgingName] = useState("")
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
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

      if (!Number.isFinite(lodgingId)) {
        setError("Error: Lodging not specified.")
        setLoading(false)
        return
      }

      try {
        const lod = await getLodgingById(lodgingId)
        if (!cancelled) setLodgingName(lod.lodging_name)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Lodging not found.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router, lodgingId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!Number.isFinite(lodgingId)) return
    if (rating < 1) return alert("Please select a rating.")
    if (!title.trim()) return alert("Review title is required.")
    if (!comment.trim()) return alert("Comment is required.")

    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lodging_id: lodgingId,
          rating_score: rating,
          review_title: title.trim(),
          review_comment: comment.trim(),
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error ?? "Failed to submit review.")
      }

      router.push("/reviews")
    } catch (e: any) {
      alert(e?.message ?? "Failed to submit review.")
    } finally {
      setSubmitting(false)
    }
  }

  const cancelHref = Number.isFinite(lodgingId)
    ? `/lodgingDetails?lodging_name=${encodeURIComponent(lodgingName)}`
    : "/"

  return (
    <>
      <Header />

      <main className="max-w-[800px] mx-auto mt-12 p-5 bg-white rounded-lg shadow">
        {loading && <p className="text-sm">Loading...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <h1 className="text-xl font-semibold text-center mb-6">
              Write a Review for {lodgingName}
            </h1>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-slate-700">Rate the Lodging:</label>
              <StarPicker value={rating} onChange={setRating} />

              <label className="text-sm font-semibold text-slate-700">Review Title:</label>
              <input
                className="border border-gray-300 rounded p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your review"
              />

              <label className="text-sm font-semibold text-slate-700">Your Comment:</label>
              <textarea
                className="border border-gray-300 rounded p-2 h-[120px] resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
              />

              <div className="flex justify-between gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-black text-white rounded hover:bg-gray-600 disabled:opacity-60"
                >
                  Submit Review
                </button>

                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                  onClick={() => router.push(cancelHref)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </>
  )
}