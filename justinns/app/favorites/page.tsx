"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { getMyFavorites, removeFromFavorites, type FavoriteRow } from "@/lib/queries"

export default function FavoritesPage() {
  const router = useRouter()

  const [favorites, setFavorites] = useState<FavoriteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    loadFavorites()
  }, [])

  async function loadFavorites() {
    try {
      setLoading(true)
      setError("")

      const data = await getMyFavorites()
      setFavorites(data)
    } catch (err: any) {
      const message = err?.message || "Failed to load favorites."

      if (
        message.toLowerCase().includes("not authenticated") ||
        message.toLowerCase().includes("user record not found")
      ) {
        router.push("/login")
        return
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(lodgingId: number) {
    try {
      setRemovingId(lodgingId)

      const result = await removeFromFavorites(lodgingId)
      alert(result.message)

      setFavorites((prev) => prev.filter((item) => item.lodging_id !== lodgingId))
    } catch (err: any) {
      alert(err?.message || "Failed to remove from favorites.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <Header />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-semibold">Favorites</h2>

        {loading ? (
          <div className="rounded border border-gray-300 p-4">Loading favorites...</div>
        ) : error ? (
          <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-4 py-3 text-left">#</th>
                  <th className="border-b px-4 py-3 text-left">Lodging Name</th>
                  <th className="border-b px-4 py-3 text-left"></th>
                </tr>
              </thead>

              <tbody>
                {favorites.length > 0 ? (
                  favorites.map((item, index) => (
                    <tr key={item.favorite_id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/lodging-details?lodging_name=${encodeURIComponent(
                            item.Name
                          )}&lodging_type=${encodeURIComponent(item.lodging_type)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.Name}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemove(item.lodging_id)}
                          disabled={removingId === item.lodging_id}
                          className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingId === item.lodging_id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-600">
                      No favorites found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}