"use client"

import { useEffect, useState } from "react"
import { addToFavorites, removeFromFavorites, isFavorite } from "@/lib/queries"

type FavoriteButtonProps = {
  lodgingId: number
}

export default function FavoriteButton({ lodgingId }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkFavorite()
  }, [lodgingId])

  async function checkFavorite() {
    try {
      setLoading(true)
      const result = await isFavorite(lodgingId)
      setFavorite(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleClick() {
    try {
      setSubmitting(true)

      if (favorite) {
        const result = await removeFromFavorites(lodgingId)
        alert(result.message)
        setFavorite(false)
      } else {
        const result = await addToFavorites(lodgingId)
        alert(result.message)
        setFavorite(true)
      }
    } catch (err: any) {
      alert(err?.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || submitting}
      className={`rounded px-4 py-2 text-white ${
        favorite ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? "Loading..." : submitting ? "Please wait..." : favorite ? "Remove Favorite" : "Add to Favorites"}
    </button>
  )
}