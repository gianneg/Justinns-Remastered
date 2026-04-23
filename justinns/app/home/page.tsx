"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { getAllLodgings, type LodgingCard } from "@/lib/queries"

type LodgingOption = {
  lodging_id: number
  lodging_name: string
  lodging_type: string
}

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

export default function HomePage() {
  const router = useRouter()

  const [lodgings, setLodgings] = useState<LodgingCard[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError("")

      try {
        const data = await getAllLodgings()
        setLodgings(data ?? [])
      } catch (e: any) {
        setError(e?.message ?? "Failed to load lodgings.")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<string, LodgingCard[]> = {}

    for (const lodging of lodgings) {
      if (!groups[lodging.lodging_type]) {
        groups[lodging.lodging_type] = []
      }

      groups[lodging.lodging_type].push(lodging)
    }

    return groups
  }, [lodgings])

  const selectedLodging = useMemo(
    () => lodgings.find((l) => String(l.lodging_id) === selectedId),
    [lodgings, selectedId]
  )

  const handleGo = () => {
    if (!selectedLodging) return

    router.push(
      `/lodging-details?lodging_name=${encodeURIComponent(
        selectedLodging.name
      )}&lodging_type=${encodeURIComponent(selectedLodging.lodging_type)}`
    )
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-center mb-10">
          <div className="flex flex-col items-center gap-4 border border-black p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-center">
              Select a lodging
            </h2>

            <p className="text-center text-sm text-gray-600">
              Have a specific place in mind already? Navigate to its page right now.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center w-full justify-center">
              <select
                className="border border-black px-3 py-2 rounded w-full sm:w-auto min-w-[250px]"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading}
              >
                <option value="">Select lodging</option>

                {Object.entries(grouped).map(([type, items]) => (
                  <optgroup key={type} label={type}>
                    {items.map((lodging) => (
                      <option key={lodging.lodging_id} value={lodging.lodging_id}>
                        {lodging.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                className="bg-black text-white px-4 py-2 rounded-full disabled:opacity-50"
                onClick={handleGo}
                disabled={!selectedLodging}
              >
                Go
              </button>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-6">All Lodgings</h1>

        {loading && <p className="text-sm">Loading...</p>}

        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && lodgings.length === 0 && (
          <h2 className="text-center text-xl mt-10">No results found</h2>
        )}

        {!loading && !error && lodgings.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lodgings.map((row) => {
              const img = row.image_path || "/default-lodging.png"

              const href = `/lodging-details?lodging_name=${encodeURIComponent(
                row.name
              )}&lodging_type=${encodeURIComponent(row.lodging_type)}`

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
                      {row.name}
                    </p>

                    <div className="mt-1 flex items-center gap-5">
                      <RatingDots rating={row.avg_rating} />
                      <div className="text-sm">
                        {row.total_ratings} Reviews
                      </div>
                    </div>

                    <p className="mt-1 text-sm">{row.location}</p>
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