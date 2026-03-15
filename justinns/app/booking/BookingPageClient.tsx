"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import DoubleCalendar from "@/components/Calendar"
import { supabase } from "@/lib/supabase"
import {
  getAllLodgings,
  fetchRoomTypesByLodging,
  type LodgingOption,
  type RoomTypeOption,
} from "@/lib/queries"

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preselectedDestination = useMemo(
    () => searchParams.get("destination") ?? "",
    [searchParams]
  )

  const preselectedRoomTypeId = useMemo(
    () => searchParams.get("room_type_id") ?? "",
    [searchParams]
  )

  const preselectedRoomTypeName = useMemo(
    () => searchParams.get("room_type") ?? "",
    [searchParams]
  )

  const [lodgings, setLodgings] = useState<LodgingOption[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([])

  const [destination, setDestination] = useState(preselectedDestination)
  const [roomTypeId, setRoomTypeId] = useState("")

  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [discountCode, setDiscountCode] = useState("")

  const [checkInISO, setCheckInISO] = useState("")
  const [checkOutISO, setCheckOutISO] = useState("")

  const [loadingLodgings, setLoadingLodgings] = useState(true)
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false)
  const [error, setError] = useState("")

  const appliedInitialRoomType = useRef(false)

  useEffect(() => {
    const guard = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.replace("/login")
    }

    guard()
  }, [router])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoadingLodgings(true)
      setError("")

      try {
        const list = await getAllLodgings()

        if (!cancelled) {
          setLodgings(list as LodgingOption[])
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load destinations.")
          setLodgings([])
        }
      } finally {
        if (!cancelled) {
          setLoadingLodgings(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!destination) {
        setRoomTypes([])
        setRoomTypeId("")
        appliedInitialRoomType.current = false
        return
      }

      setLoadingRoomTypes(true)
      setError("")

      try {
        const types = await fetchRoomTypesByLodging(Number(destination))

        if (cancelled) return

        setRoomTypes(types)

        if (!appliedInitialRoomType.current) {
          let matchedId = ""

          if (preselectedRoomTypeId) {
            const matchById = types.find(
              (rt) => String(rt.room_type_id) === String(preselectedRoomTypeId)
            )
            if (matchById) {
              matchedId = String(matchById.room_type_id)
            }
          }

          if (!matchedId && preselectedRoomTypeName) {
            const matchByName = types.find(
              (rt) =>
                rt.room_type.trim().toLowerCase() ===
                preselectedRoomTypeName.trim().toLowerCase()
            )
            if (matchByName) {
              matchedId = String(matchByName.room_type_id)
            }
          }

          setRoomTypeId(matchedId)
          appliedInitialRoomType.current = true
        } else {
          const stillExists = types.some(
            (rt) => String(rt.room_type_id) === String(roomTypeId)
          )

          if (!stillExists) {
            setRoomTypeId("")
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load room types.")
          setRoomTypes([])
          setRoomTypeId("")
        }
      } finally {
        if (!cancelled) {
          setLoadingRoomTypes(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [destination, preselectedRoomTypeId, preselectedRoomTypeName, roomTypeId])

  const totalGuests = adults + children

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!destination) {
      alert("Select destination.")
      return
    }

    if (!roomTypeId) {
      alert("Select room type.")
      return
    }

    if (!checkInISO || !checkOutISO) {
      alert("Select check-in and check-out dates.")
      return
    }

    const qs = new URLSearchParams({
      lodgingId: destination,
      roomTypeId,
      checkIn: checkInISO,
      checkOut: checkOutISO,
      adults: String(adults),
      children: String(children),
      guests: String(totalGuests),
      code: discountCode,
    })

    router.push(`/booking/pick-room?${qs.toString()}`)
  }

  return (
    <>
      <Header />

      <main className="mt-10 flex justify-center">
        <div className="w-[1100px]">
          <form onSubmit={handleConfirm}>
            <div className="mb-5">
              <label className="block text-sm mb-1">DESTINATION</label>

              <select
                className="h-10 w-[300px] border border-gray-300 rounded px-2"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value)
                  setRoomTypeId("")
                  appliedInitialRoomType.current = false
                }}
                disabled={loadingLodgings}
              >
                <option value="">
                  {loadingLodgings ? "Loading destinations..." : "Select Destination"}
                </option>

                {lodgings.map((l) => (
                  <option key={l.lodging_id} value={String(l.lodging_id)}>
                    {l.lodging_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between p-5 shadow-md">
              <DoubleCalendar
                onChange={({ checkInISO, checkOutISO }) => {
                  setCheckInISO(checkInISO)
                  setCheckOutISO(checkOutISO)
                }}
              />

              <div className="w-[220px] p-5 shadow-lg">
                <h3 className="text-center text-xl mb-4">Book Your Stay</h3>
                <hr className="mb-3" />

                <label className="font-bold block mt-2 mb-1 text-sm">Room Type</label>
                <select
                  className="w-full p-2 text-xs border border-gray-300 rounded mb-3"
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  disabled={!destination || loadingRoomTypes}
                >
                  {!destination ? (
                    <option value="">Select a destination first</option>
                  ) : loadingRoomTypes ? (
                    <option value="">Loading room types...</option>
                  ) : roomTypes.length === 0 ? (
                    <option value="">No room types available</option>
                  ) : (
                    <>
                      <option value="">Select Room Type</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.room_type_id} value={String(rt.room_type_id)}>
                          {rt.room_type}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <label className="font-bold block mt-2 mb-1 text-sm">Adults</label>
                <select
                  className="w-full p-2 text-xs border border-gray-300 rounded mb-3"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Adult{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>

                <label className="font-bold block mt-2 mb-1 text-sm">Children</label>
                <select
                  className="w-full p-2 text-xs border border-gray-300 rounded mb-3"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "N/A" : `${n} Child${n > 1 ? "ren" : ""}`}
                    </option>
                  ))}
                </select>

                <label className="font-bold block mt-2 mb-1 text-sm">Know a code?</label>
                <input
                  className="w-full h-10 bg-gray-200 px-2 mb-4"
                  placeholder="Use it!"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />

                <button
                  type="submit"
                  className="w-full bg-gray-200 py-3 hover:bg-gray-500 hover:text-white"
                >
                  CONFIRM →
                </button>

                <p className="text-xs mt-3">
                  {checkInISO && checkOutISO
                    ? `Dates: ${checkInISO} → ${checkOutISO}`
                    : "Select your dates"}
                </p>

                {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}