"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"
import { fetchDiscountPercent, fetchRoomTypePrice, nightsBetween } from "@/lib/booking"

export default function ConfirmationPage() {
  const sp = useSearchParams()

  const lodgingId = sp.get("lodgingId") ?? ""
  const roomTypeId = sp.get("roomTypeId") ?? ""
  const roomId = sp.get("roomId") ?? ""
  const checkIn = sp.get("checkIn") ?? ""
  const checkOut = sp.get("checkOut") ?? ""
  const adults = Number(sp.get("adults") ?? "0")
  const children = Number(sp.get("children") ?? "0")
  const guests = Number(sp.get("guests") ?? "0")
  const code = sp.get("code") ?? ""

  const ready = useMemo(() => {
    return lodgingId && roomTypeId && roomId && checkIn && checkOut
  }, [lodgingId, roomTypeId, roomId, checkIn, checkOut])

  const [lodgingName, setLodgingName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [roomTypeName, setRoomTypeName] = useState("")
  const [roomPrice, setRoomPrice] = useState(0)

  const [discountedAmount, setDiscountedAmount] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)

  const nights = useMemo(() => (ready ? nightsBetween(checkIn, checkOut) : 0), [ready, checkIn, checkOut])
  const originalPrice = useMemo(() => roomPrice * nights, [roomPrice, nights])

  useEffect(() => {
    if (!ready) return

    let cancelled = false
    const run = async () => {
      // lodging name
      const { data: lod } = await supabase
        .from("lodging")
        .select("lodging_name")
        .eq("lodging_id", Number(lodgingId))
        .single()

      // room number
      const { data: room } = await supabase
        .from("room")
        .select("room_number")
        .eq("room_id", Number(roomId))
        .single()

      // room type + price
      const rt = await fetchRoomTypePrice(Number(roomTypeId))

      if (cancelled) return
      setLodgingName(lod?.lodging_name ?? "")
      setRoomNumber(room?.room_number ?? "")
      setRoomTypeName(rt.room_type)
      setRoomPrice(Number(rt.room_price))
    }

    run()
    return () => { cancelled = true }
  }, [ready, lodgingId, roomId, roomTypeId])

  useEffect(() => {
    const run = async () => {
      if (!ready) return
      if (!roomPrice || !nights) return

      const pct = await fetchDiscountPercent(code) // ex: 10 for 10%
      if (!pct) {
        setDiscountedAmount(0)
        setFinalPrice(originalPrice)
        return
      }

      const discount = roomPrice * (pct / 100) * nights
      setDiscountedAmount(discount)
      setFinalPrice(originalPrice - discount)
    }

    run()
  }, [ready, code, roomPrice, nights, originalPrice])

  if (!ready) {
    return (
      <>
        <Header />
        <main className="py-10">
          <p className="text-sm">Missing booking info in URL.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="py-10">
        <div className="flex justify-center gap-5">

          {/* Left side form */}
          <div className="w-[800px]">
            <div className="mx-auto w-[70%] border border-gray-300 shadow-md p-5">
              <h3 className="text-lg font-semibold mb-3">Guest Details</h3>

              <form className="flex flex-col gap-2">
                <label className="text-sm">Contact Number</label>
                <input className="border border-gray-300 rounded p-2" placeholder="Contact" required />

                <label className="text-sm mt-2">Address</label>
                <input className="border border-gray-300 rounded p-2" placeholder="Address" required />

                <h3 className="text-lg font-semibold mt-4">Payment Details</h3>

                <label className="text-sm mt-2">Card Number</label>
                <input className="border border-gray-300 rounded p-2" placeholder="Card Number" required />

                <div className="flex gap-2">
                  <select className="border border-gray-300 rounded p-2 w-full" required>
                    <option value="">Month</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>

                  <select className="border border-gray-300 rounded p-2 w-full" required>
                    <option value="">Year</option>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const y = new Date().getFullYear() + i
                      return <option key={y} value={y}>{y}</option>
                    })}
                  </select>

                  <input className="border border-gray-300 rounded p-2 w-[30%]" placeholder="CVV" required />
                </div>

                <label className="text-sm mt-2">Full Name on Card</label>
                <input className="border border-gray-300 rounded p-2" placeholder="Name on card" required />

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>

                  <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
                    <li>Reservations are subject to availability and may be cancelled/modified by the lodging.</li>
                    <li>A card is required to guarantee the reservation and may be charged for cancellations/damages.</li>
                    <li>The lodging is not responsible for lost or stolen items.</li>
                    <li>The lodging may refuse service.</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Cancellation Policy</h3>
                  <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
                    <li>Cancel at least 24 hours before check-in to avoid fees.</li>
                    <li>Cancellations within 24 hours may be charged one night.</li>
                    <li>No-shows may be charged the full amount.</li>
                  </ul>

                  <div className="mt-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" required />
                      I agree to the terms and conditions*
                    </label>

                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" />
                      Receive special offers and updates
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-4 bg-gray-200 py-3 hover:bg-white border border-gray-200"
                >
                  Confirm Reservation
                </button>
              </form>
            </div>
          </div>

          {/* Right side summary */}
          <div className="w-[350px] h-[700px] border border-gray-300 shadow-md p-5">
            <h2 className="text-xl font-semibold mb-3">Booking Summary</h2>

            <div className="text-sm space-y-2">
              <h3 className="border-t pt-3 font-semibold">
                Destination: {lodgingName}
              </h3>

              <p className="border-t pt-3">
                Reserving Room {roomNumber} - {roomTypeName}
              </p>

              <h3 className="border-t pt-3 font-semibold">Number of Guests</h3>
              <p>Number of Adults: {adults}</p>
              <p>Number of Children: {children}</p>
              <p>Total Number of Guests: {guests}</p>

              <h3 className="border-t pt-3 font-semibold">Check-in and Check-out Dates</h3>
              <p>Check-in: {checkIn}</p>
              <p>Check-out: {checkOut}</p>

              <h3 className="border-t pt-3 font-semibold">Breakdown of Costs</h3>
              <p>Price per Night: {roomPrice} Php</p>
              <p>Number of nights: {nights}</p>
              <p>Original cost: {originalPrice} Php</p>
              <p>Discount code used: {code || "-"}</p>
              <p>Discounted: {Math.round(discountedAmount)} Php</p>

              <h3 className="border-t pt-2 text-[1.6em] font-semibold">
                Total Cost: {Math.round(finalPrice)} Php
              </h3>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}