"use client"

import { useEffect, useState } from "react"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

type Discount = {
  discount_id: number
  discount_code: string
  discounted_price: number
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDiscounts = async () => {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("discount")
        .select("discount_id, discount_code, discounted_price")
        .order("discount_id", { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setDiscounts(data ?? [])
      }

      setLoading(false)
    }

    fetchDiscounts()
  }, [])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-center">
          <section className="w-full max-w-3xl border border-black p-6 rounded-lg">
            <h1 className="text-2xl font-semibold mb-6 text-center">
              Discounts
            </h1>

            {loading && <p className="text-sm text-center">Loading...</p>}

            {!loading && error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {!loading && !error && discounts.length === 0 && (
              <p className="text-center text-lg">No discounts found.</p>
            )}

            {!loading && !error && discounts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black text-left">
                      <th className="px-4 py-3 w-16">#</th>
                      <th className="px-4 py-3">Discount Code</th>
                      <th className="px-4 py-3">Discount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {discounts.map((row, index) => (
                      <tr
                        key={row.discount_id}
                        className="border-b border-gray-300"
                      >
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          {row.discount_code}
                        </td>
                        <td className="px-4 py-3">
                          {row.discounted_price}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}