"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

type RoomRow = {
  room_id: number
  room_number: string
  room_floor: string | number | null
  lodging_id: number
  room_type_id: number
  room_type: {
    room_type_id: number
    room_type: string
    max_persons: number
  } | null
}

type BookingRow = {
  room_id: number
  checkin_date: string
  checkout_date: string
  status: string
}

type AvailableRoom = {
  room_id: number
  room_number: string
  room_floor: string | number | null
  lodging_id: number
  room_type: string
}

function datesOverlap(
  requestedCheckIn: string,
  requestedCheckOut: string,
  bookingCheckIn: string,
  bookingCheckOut: string
) {
  const reqStart = new Date(`${requestedCheckIn}T00:00:00`)
  const reqEnd = new Date(`${requestedCheckOut}T00:00:00`)
  const bookStart = new Date(`${bookingCheckIn}T00:00:00`)
  const bookEnd = new Date(`${bookingCheckOut}T00:00:00`)

  return reqStart < bookEnd && reqEnd > bookStart
}

export default function PickRoomPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const lodgingId = sp.get("lodgingId") ?? ""
  const roomTypeId = sp.get("roomTypeId") ?? ""
  const checkIn = sp.get("checkIn") ?? ""
  const checkOut = sp.get("checkOut") ?? ""
  const adults = Number(sp.get("adults") ?? "0")
  const children = Number(sp.get("children") ?? "0")
  const guests = Number(sp.get("guests") ?? "0")
  const code = sp.get("code") ?? ""

  const ready = useMemo(() => {
    return Boolean(lodgingId && roomTypeId && checkIn && checkOut)
  }, [lodgingId, roomTypeId, checkIn, checkOut])

  const [rooms, setRooms] = useState<AvailableRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const guard = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace("/login")
      }
    }

    guard()
  }, [router])

  useEffect(() => {
    if (!ready) {
      setLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError("")

      try {
        const { data: roomData, error: roomError } = await supabase
          .from("room")
          .select(`
            room_id,
            room_number,
            room_floor,
            lodging_id,
            room_type_id,
            room_type (
              room_type_id,
              room_type,
              max_persons
            )
          `)
          .eq("lodging_id", Number(lodgingId))
          .eq("room_type_id", Number(roomTypeId))

        if (roomError) throw roomError

        const typedRooms = (roomData ?? []) as RoomRow[]

        const filteredByCapacity = typedRooms.filter((room) => {
          return Number(room.room_type?.max_persons ?? 0) >= guests
        })

        if (filteredByCapacity.length === 0) {
          if (!cancelled) {
            setRooms([])
          }
          return
        }

        const roomIds = filteredByCapacity.map((room) => room.room_id)

        const { data: bookingData, error: bookingError } = await supabase
          .from("booking")
          .select("room_id, checkin_date, checkout_date, status")
          .in("room_id", roomIds)
          .eq("status", "Active")

        if (bookingError) throw bookingError

        const activeBookings = (bookingData ?? []) as BookingRow[]

        const availableRooms = filteredByCapacity.filter((room) => {
          const conflictingBooking = activeBookings.find((booking) => {
            if (booking.room_id !== room.room_id) return false

            return datesOverlap(
              checkIn,
              checkOut,
              booking.checkin_date,
              booking.checkout_date
            )
          })

          return !conflictingBooking
        })

        const mappedRooms: AvailableRoom[] = availableRooms.map((room) => ({
          room_id: room.room_id,
          room_number: room.room_number,
          room_floor: room.room_floor,
          lodging_id: room.lodging_id,
          room_type: room.room_type?.room_type ?? "",
        }))

        if (!cancelled) {
          setRooms(mappedRooms)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load available rooms.")
          setRooms([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [ready, lodgingId, roomTypeId, checkIn, checkOut, guests])

  const handleBookRoom = (roomId: number) => {
    const qs = new URLSearchParams({
      lodgingId,
      roomTypeId,
      roomId: String(roomId),
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      guests: String(guests),
      code,
    })

    router.push(`/booking/confirmation?${qs.toString()}`)
  }

  if (!ready) {
    return (
      <>
        <Header />
        <main className="py-10 flex justify-center">
          <div className="w-[1000px]">
            <p className="text-sm text-red-600">Missing booking details.</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="py-10 flex justify-center">
        <div className="w-[1000px]">
          {loading ? (
            <p className="text-sm">Loading available rooms...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : rooms.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Number of available rooms: {rooms.length}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">
                        Room Number
                      </th>
                      <th className="border border-gray-300 p-3 text-left">
                        Room Floor
                      </th>
                      <th className="border border-gray-300 p-3 text-left">
                        Room Type
                      </th>
                      <th className="border border-gray-300 p-3 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rooms.map((room, index) => (
                      <tr
                        key={room.room_id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border border-gray-300 p-3">
                          {room.room_number}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {room.room_floor ?? "-"}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {room.room_type}
                        </td>
                        <td className="border border-gray-300 p-3">
                          <button
                            type="button"
                            onClick={() => handleBookRoom(room.room_id)}
                            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-500 hover:text-white"
                          >
                            Book this room!
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                No available rooms found.
              </h3>

              <button
                type="button"
                onClick={() => router.push("/booking")}
                className="text-blue-600 underline"
              >
                Select another date.
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}