"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { getAllLodgings } from "@/lib/queries"

type LodgingOption = {
  lodging_id: number
  lodging_name: string
  lodging_type: string
}

export default function HomePage() {
  const router = useRouter()

  const [lodgings, setLodgings] = useState<LodgingOption[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getAllLodgings()

        const mapped = (data ?? []).map((x: any) => ({
          lodging_id: Number(x.lodging_id),
          lodging_name: x.lodging_name,
          lodging_type: x.lodging_type,
        }))

        setLodgings(mapped)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<string, LodgingOption[]> = {}

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
        selectedLodging.lodging_name
      )}&lodging_type=${encodeURIComponent(selectedLodging.lodging_type)}`
    )
  }

  return (
    <>
      <Header />

      <div className="flex justify-center mt-10">
        <div className="flex flex-col items-center gap-4 border border-black p-6">

          <h3 className="text-lg text-center">
            Have a specific place in mind already? Navigate to their page right now.
          </h3>

          <div className="flex gap-3 items-center">

            <select
              className="border border-black px-3 py-2 rounded"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select lodging</option>

              {Object.entries(grouped).map(([type, items]) => (
                <optgroup key={type} label={type}>
                  {items.map((lodging) => (
                    <option key={lodging.lodging_id} value={lodging.lodging_id}>
                      {lodging.lodging_name}
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
    </>
  )
}