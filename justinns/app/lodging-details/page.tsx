"use client"

import Header from "@/components/Header"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  fetchAvailableRooms,
  fetchLodgingDetailsByName,
  fetchLodgingImages,
  fetchLodgingReviews,
  fetchRatingStats,
  type LodgingDetails,
  type LodgingImage,
  type RatingStats,
  type ReviewRow,
  type RoomRow,
} from "@/lib/lodgingDetails"

function RatingDots({ rating }: { rating: number }) {
  const filled = Math.floor(rating || 0)
  const empty = Math.max(0, 5 - filled)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: filled }).map((_, i) => (
        <span key={`f-${i}`} className="h-3 w-3 rounded-full bg-salmon" />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e-${i}`} className="h-3 w-3 rounded-full border border-salmon" />
      ))}
    </div>
  )
}

function ReviewRating({ score }: { score: number }) {
  const full = Math.floor(score || 0)
  const hasHalf = score - full >= 0.5
  const empty = Math.max(0, 5 - full - (hasHalf ? 1 : 0))

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`rf-${i}`} className="h-3 w-3 rounded-full bg-salmon" />
      ))}
      {hasHalf && (
        <span className="h-3 w-3 rounded-full bg-salmon/50" title="half" />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`re-${i}`} className="h-3 w-3 rounded-full border border-salmon" />
      ))}
    </div>
  )
}

export default function LodgingDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const lodgingName = useMemo(
    () => searchParams.get("lodging_name") ?? "",
    [searchParams]
  )
  const lodgingType = useMemo(
    () => searchParams.get("lodging_type") ?? "",
    [searchParams]
  )

  const [lodging, setLodging] = useState<LodgingDetails | null>(null)
  const [stats, setStats] = useState<RatingStats>({ Avg_Rating: 0, Total_Ratings: 0 })
  const [images, setImages] = useState<LodgingImage[]>([])
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [mainImage, setMainImage] = useState<string>("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!lodgingName) return

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const [lod, st, imgs, rms, revs] = await Promise.all([
          fetchLodgingDetailsByName(lodgingName),
          fetchRatingStats(lodgingName),
          fetchLodgingImages(lodgingName),
          fetchAvailableRooms(lodgingName),
          fetchLodgingReviews(lodgingName),
        ])

        if (cancelled) return

        setLodging(lod)
        setStats(st)
        setImages(imgs)
        setRooms(rms)
        setReviews(revs)

        const first = imgs?.[0]?.File_Path || "https://via.placeholder.com/700x400"
        setMainImage(first)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load lodging details.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [lodgingName])

  if (!lodgingName) {
    return (
      <>
        <Header />
        <main className="py-10">
          <p className="text-sm">Missing lodging_name in URL.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="py-6">

        {/* Breadcrumbs */}
        <div className="text-sm mb-4">
          <Link
            className="text-black hover:underline"
            href={`/lodging?lodging_type=${encodeURIComponent(lodgingType || "Hotel")}`}
          >
            {lodgingType || "Back"}
          </Link>{" "}
          <span className="mx-2">{">"}</span>
          <span>{lodgingName}</span>
        </div>

        {loading && <p className="text-sm">Loading...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && lodging && (
          <>
            {/* Header section */}
            <section className="bg-white rounded-lg pt-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[32px] font-semibold text-slate-800">
                  {lodging.Name}
                </h1>

                <button
                  onClick={() => setSaved((v) => !v)}
                  className={`border rounded-full px-4 py-2 text-sm flex items-center gap-2 ${
                    saved ? "bg-white text-black border-black font-semibold" : "bg-black text-white border-gray-300"
                  }`}
                >
                  <span className="text-base">{saved ? "♥" : "♡"}</span>
                  Save
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                <a href="#reviews" className="inline-flex items-center gap-3 hover:underline">
                  <RatingDots rating={stats.Avg_Rating} />
                  <span>{stats.Total_Ratings} Reviews</span>
                </a>

                <div className="mt-2 flex flex-col gap-1">
                  <p className="flex items-center gap-2">
                    <span>📍</span> {lodging.Location}
                  </p>

                  <button
                    className="text-left hover:underline w-fit"
                    onClick={() => router.push(`/write-review?lodging_name=${encodeURIComponent(lodgingName)}`)}
                  >
                    ✍️ Write a review
                  </button>
                </div>
              </div>
            </section>

            {/* About + Images */}
            <section className="mt-12 bg-white shadow-sm rounded-lg">
              <div className="flex flex-col lg:flex-row gap-6 p-5">
                <div className="lg:w-[40%]">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {lodging.Description || "No description yet."}
                  </p>
                </div>

                <div className="lg:w-[60%] flex flex-col items-center">
                  {/* Main image */}
                  <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
                    <Image
                      src={mainImage || "https://via.placeholder.com/700x400"}
                      alt={`Main Image of ${lodging.Name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>

                  {/* Gallery */}
                  <div className="mt-4 w-full flex justify-between gap-2 overflow-x-auto">
                    {images.slice(0, 10).map((img, idx) => (
                      <button
                        key={`${img.File_Path}-${idx}`}
                        onClick={() => setMainImage(img.File_Path)}
                        className="shrink-0 border-2 border-transparent hover:border-salmon rounded"
                        title="View"
                      >
                        <Image
                          src={img.File_Path}
                          alt={`Image of ${lodging.Name}`}
                          width={80}
                          height={80}
                          className="h-[80px] w-[80px] object-cover rounded"
                        />
                      </button>
                    ))}

                    {images.length === 0 && (
                      <p className="text-sm text-slate-600">No images available for this lodging.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Availability */}
            <section className="mt-12">
              <h2 className="text-2xl font-semibold mb-4">Availability</h2>

              <div className="overflow-hidden rounded-2xl border border-black">
                <table className="w-full bg-white">
                  <thead className="bg-salmon text-white">
                    <tr>
                      <th className="text-left p-4">Room type</th>
                      <th className="text-left p-4">Number of guests</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {rooms.length > 0 ? (
                      rooms.map((r, idx) => (
                        <tr key={`${r.Room_Type}-${idx}`} className="hover:bg-slate-100 border-t">
                          <td className="p-4">
                            <span className="font-bold hover:underline cursor-pointer">
                              {r.Room_Type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-700">{r.Max_Persons}</td>
                          <td className="p-4 text-right">
                            <button
                              className="bg-black text-white font-bold px-4 py-2 border border-black hover:bg-white hover:text-black hover:border-gray-300"
                              onClick={() => router.push("/booking")}
                            >
                              Book Now
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td className="p-4" colSpan={3}>
                          No rooms available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Reviews */}
            <section className="mt-12">
              <h2 id="reviews" className="text-2xl font-semibold mb-4">
                Reviews
              </h2>

              {reviews.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {reviews.map((rev, idx) => {
                    const avatar =
                      rev.file_path ||
                      "https://simplyilm.com/wp-content/uploads/2017/08/temporary-profile-placeholder-1.jpg"

                    const name =
                      rev.anon === 0 && rev.FirstName
                        ? `${rev.FirstName ?? ""} ${rev.LastName ?? ""}`.trim()
                        : "Anonymous"

                    return (
                      <div
                        key={`${rev.Review_Title}-${idx}`}
                        className="bg-white w-full lg:w-[75%] border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center gap-4 p-4 border-b border-gray-200">
                          <Image
                            src={avatar}
                            alt="Profile"
                            width={50}
                            height={50}
                            className="rounded-full"
                          />
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              {name}
                            </h3>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="mb-2">
                            <ReviewRating score={rev.Rating_Score} />
                          </div>

                          <h4 className="text-lg font-semibold text-slate-800 mb-1">
                            {rev.Review_Title}
                          </h4>

                          <p className="text-sm text-slate-700 leading-6">
                            {rev.Review_Comment}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm">No reviews available for this lodging.</p>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}