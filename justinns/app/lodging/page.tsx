"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import { getLodgingData, type LodgingDetails } from "@/lib/queries"

function RatingDots({ rating }: { rating: number }) {
  const filled = Math.floor(rating || 0)
  const empty = Math.max(0, 5 - filled)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: filled }).map((_, i) => (
        <span
          key={`f-${i}`}
          className="inline-block h-3 w-3 rounded-full bg-salmon"
          title="filled"
        />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span
          key={`e-${i}`}
          className="inline-block h-3 w-3 rounded-full border border-salmon"
          title="empty"
        />
      ))}
    </div>
  )
}

export default function LodgingPage() {
  const searchParams = useSearchParams()
  const lodgingType = useMemo(
    () => searchParams.get("lodging_type") ?? "Hotel",
    [searchParams]
  )

  const [rows, setRows] = useState<LodgingDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await getLodgingData(lodgingType)
        if (!cancelled) setRows(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load lodging data.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [lodgingType])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">{lodgingType}s</h1>

        {loading && <p className="text-sm">Loading...</p>}

        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && rows.length === 0 && (
          <h1 className="text-center text-xl mt-10">No results found</h1>
        )}

        {!loading && !error && rows.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((row) => {
              const img =
                row.Image_Path || "https://via.placeholder.com/700x400"

              const href = `/lodging-details?lodging_name=${encodeURIComponent(
                row.Name
              )}&lodging_type=${encodeURIComponent(lodgingType)}`

              return (
                <div key={row.lodging_id} className="group">
                  <Link href={href} className="block text-black">
                    <div className="relative w-full aspect-[338.6/213.06] overflow-hidden rounded-[10px]">
                      <Image
                        src={img}
                        alt="Lodging Image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    </div>

                    <p className="mt-3 text-[18px] font-bold group-hover:underline">
                      {row.lodging_name}
                    </p>

                    <div className="mt-1 flex items-center gap-5">
                      <RatingDots rating={row.Avg_Rating} />
                      <div className="text-sm">
                        {row.Total_Ratings} Reviews
                      </div>
                    </div>

                    <p className="mt-1 text-sm">{row.Location}</p>
                  </Link>
                </div>
              )
            })}
          </section>
        )}
      </main>
    </>
  )
}