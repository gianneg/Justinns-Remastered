"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import DoubleCalendar from "@/components/Calendar"
import { supabase } from "@/lib/supabase"
import { getAllLodgings, getAvailableRooms } from "@/lib/queries"
import type { LodgingOption, RoomTypeOption } from "@/lib/queries"

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preselectedDestination = useMemo(
    () => searchParams.get("destination") ?? "",
    [searchParams]
  )
  const preselectedRoomType = useMemo(
    () => searchParams.get("room_type") ?? "",
    [searchParams]
  )

  const [lodgings, setLodgings] = useState<LodgingOption[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([])

  const [destination, setDestination] = useState(preselectedDestination)
  const [roomTypeId, setRoomTypeId] = useState(preselectedRoomType)

  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [discountCode, setDiscountCode] = useState("")

  const [checkInISO, setCheckInISO] = useState("")
  const [checkOutISO, setCheckOutISO] = useState("")

  useEffect(() => {
    const guard = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.replace("/login")
    }
    guard()
  }, [router])

  useEffect(() => {
    const run = async () => {
      const list = await getAllLodgings()
      setLodgings(list)
    }
    run()
  }, [])

  useEffect(() => {
    const run = async () => {
      if (!destination) {
        setRoomTypes([])
        setRoomTypeId("")
        return
      }
  
      const types = await getAvailableRooms(String(destination))
      setRoomTypes(types)
  
      if (preselectedRoomType) setRoomTypeId(preselectedRoomType)
      else setRoomTypeId("")
    }
  
    run()
  }, [destination])

  const totalGuests = adults + children

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!destination) return alert("Select destination.")
    if (!roomTypeId) return alert("Select room type.")
    if (!checkInISO || !checkOutISO) return alert("Select check-in and check-out dates.")

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
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">Select Destination</option>
                {lodgings.map((l) => (
                  <option key={l.lodging_id} value={String(l.lodging_id)}>
                    {l.lodging_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between p-5 shadow-md">

              {/* Calendar */}
              <DoubleCalendar
                onChange={({ checkInISO, checkOutISO }) => {
                  setCheckInISO(checkInISO)
                  setCheckOutISO(checkOutISO)
                }}
              />

              {/* Right panel */}
              <div className="w-[220px] p-5 shadow-lg">
                <h3 className="text-center text-xl mb-4">Book Your Stay</h3>
                <hr className="mb-3" />

                <label className="font-bold block mt-2 mb-1 text-sm">Room Type</label>
                <select
                  className="w-full p-2 text-xs border border-gray-300 rounded mb-3"
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                >
                  {!destination ? (
                    <option value="">Select a destination first</option>
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
                  {[1,2,3,4,5].map((n) => (
                    <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>
                  ))}
                </select>

                <label className="font-bold block mt-2 mb-1 text-sm">Children</label>
                <select
                  className="w-full p-2 text-xs border border-gray-300 rounded mb-3"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                >
                  {[0,1,2,3,4,5].map((n) => (
                    <option key={n} value={n}>{n === 0 ? "N/A" : `${n} Child${n > 1 ? "ren" : ""}`}</option>
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
              </div>

            </div>
          </form>

        </div>
      </main>
    </>
  )
}