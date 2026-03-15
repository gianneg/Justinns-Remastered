"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"
import {
  fetchDiscountPercent,
  fetchRoomTypePrice,
  nightsBetween,
} from "@/lib/booking"

export default function ConfirmationPage() {
  const router = useRouter()
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
    return Boolean(lodgingId && roomTypeId && roomId && checkIn && checkOut)
  }, [lodgingId, roomTypeId, roomId, checkIn, checkOut])

  const [lodgingName, setLodgingName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [roomTypeName, setRoomTypeName] = useState("")
  const [roomPrice, setRoomPrice] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [redirectPath, setRedirectPath] = useState("")
  const [isSuccessModal, setIsSuccessModal] = useState(false)

  const [discountedAmount, setDiscountedAmount] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const nights = useMemo(() => {
    return ready ? nightsBetween(checkIn, checkOut) : 0
  }, [ready, checkIn, checkOut])

  const originalPrice = useMemo(() => {
    return roomPrice * nights
  }, [roomPrice, nights])

  useEffect(() => {
    if (!ready) {
      setLoading(false)
      setError("Missing booking info in URL.")
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError("")

      try {
        const [
          { data: lodging, error: lodgingError },
          { data: room, error: roomError },
          roomTypeData,
        ] = await Promise.all([
          supabase
            .from("lodging")
            .select("lodging_name")
            .eq("lodging_id", Number(lodgingId))
            .single(),
          supabase
            .from("room")
            .select("room_number")
            .eq("room_id", Number(roomId))
            .single(),
          fetchRoomTypePrice(Number(roomTypeId)),
        ])

        if (lodgingError) throw lodgingError
        if (roomError) throw roomError
        if (!roomTypeData) {
          throw new Error("Failed to load room type details.")
        }

        if (cancelled) return

        setLodgingName(lodging?.lodging_name ?? "")
        setRoomNumber(room?.room_number ?? "")
        setRoomTypeName(roomTypeData.room_type ?? "")
        setRoomPrice(Number(roomTypeData.room_price ?? 0))
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load booking summary.")
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
  }, [ready, lodgingId, roomId, roomTypeId])

  useEffect(() => {
    if (!ready) return

    let cancelled = false

    const run = async () => {
      if (!roomPrice || !nights) {
        if (!cancelled) {
          setDiscountedAmount(0)
          setFinalPrice(0)
        }
        return
      }

      try {
        const pct = await fetchDiscountPercent(code)

        if (cancelled) return

        if (!pct || pct <= 0) {
          setDiscountedAmount(0)
          setFinalPrice(originalPrice)
          return
        }

        const discount = roomPrice * (pct / 100) * nights
        setDiscountedAmount(discount)
        setFinalPrice(originalPrice - discount)
      } catch {
        if (!cancelled) {
          setDiscountedAmount(0)
          setFinalPrice(originalPrice)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [ready, code, roomPrice, nights, originalPrice])

  useEffect(() => {
  if (!modalOpen || !isSuccessModal || !redirectPath) return

  setRedirectCountdown(5)

  const interval = setInterval(() => {
    setRedirectCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(interval)
        router.push(redirectPath)
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(interval)
}, [modalOpen, isSuccessModal, redirectPath, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!ready) {
    setModalTitle("Missing Booking Information")
    setModalMessage("Missing booking information.")
    setIsSuccessModal(false)
    setRedirectPath("")
    setModalOpen(true)
    return
  }

  const form = e.currentTarget
  const formData = new FormData(form)

  setSubmitting(true)

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      throw new Error("You must be logged in to confirm a reservation.")
    }

    const authId = authData.user.id

    const { data: userRow, error: userError } = await supabase
      .from("user")
      .select("user_id")
      .eq("auth_id", authId)
      .single()

    if (userError) {
      throw userError
    }

    if (!userRow) {
      throw new Error("User record not found.")
    }

    const contact = String(formData.get("contact") ?? "").trim()
    const address = String(formData.get("address") ?? "").trim()
    const cardName = String(formData.get("cardName") ?? "").trim()

    if (!contact) throw new Error("Contact number is required.")
    if (!address) throw new Error("Address is required.")
    if (!cardName) throw new Error("Name on card is required.")

    const bookedBy = cardName || authData.user.email || "Guest"

    const { error: bookingError } = await supabase.from("booking").insert({
      booked_by: bookedBy,
      checkin_date: checkIn,
      checkout_date: checkOut,
      adults,
      children,
      room_id: Number(roomId),
      user_id: userRow.user_id,
      status: "Active",
    })

    if (bookingError) {
      throw bookingError
    }

    setModalTitle("Reservation Confirmed")
    setModalMessage("Your reservation has been confirmed successfully.")
    setIsSuccessModal(true)
    setRedirectPath("/dashboards/user-dashboard")
    setModalOpen(true)
  } catch (e: any) {
    setModalTitle("Reservation Failed")
    setModalMessage(e?.message ?? "Failed to confirm reservation.")
    setIsSuccessModal(false)
    setRedirectPath("")
    setModalOpen(true)
  } finally {
    setSubmitting(false)
  }
}

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
          <div className="w-[800px]">
            <div className="mx-auto w-[70%] border border-gray-300 shadow-md p-5">
              <h3 className="text-lg font-semibold mb-3">Guest Details</h3>

              <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <label className="text-sm">Contact Details</label>
                <input
                  name="contact"
                  className="border border-gray-300 rounded p-2"
                  placeholder="Name"
                  required
                />

                <input
                  name="address"
                  className="border border-gray-300 rounded p-2"
                  placeholder="Address"
                  required
                />

                <h3 className="text-lg font-semibold mt-4">Payment Details</h3>
                <label className="text-sm mt-2">Card Number</label>
                <input
                  name="cardNumber"
                  className="border border-gray-300 rounded p-2"
                  placeholder="Card Number"
                  required
                />

                <div className="flex gap-2">
                  <select
                    name="expiryMonth"
                    className="border border-gray-300 rounded p-2 w-full"
                    required
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  <select
                    name="expiryYear"
                    className="border border-gray-300 rounded p-2 w-full"
                    required
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const y = new Date().getFullYear() + i
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    })}
                  </select>

                  <input
                    name="cvv"
                    className="border border-gray-300 rounded p-2 w-[30%]"
                    placeholder="CVV"
                    required
                  />
                </div>

                <label className="text-sm mt-2">Full Name on Card</label>
                <input
                  name="cardName"
                  className="border border-gray-300 rounded p-2"
                  placeholder="Name on card"
                  required
                />

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Terms and Conditions
                  </h3>

                  <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
                    <li>
                      Reservations are subject to availability and may be
                      cancelled or modified by the lodging.
                    </li>
                    <li>
                      A card is required to guarantee the reservation and may be
                      charged for cancellations or damages.
                    </li>
                    <li>
                      The lodging is not responsible for lost or stolen items.
                    </li>
                    <li>The lodging may refuse service.</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">
                    Cancellation Policy
                  </h3>
                  <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
                    <li>Cancel at least 24 hours before check-in to avoid fees.</li>
                    <li>
                      Cancellations within 24 hours may be charged one night.
                    </li>
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
                  disabled={submitting || loading}
                  className="mt-4 bg-gray-200 py-3 hover:bg-white border border-gray-200 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Confirm Reservation"}
                </button>
              </form>
            </div>
          </div>

          <div className="w-[350px] min-h-[700px] border border-gray-300 shadow-md p-5">
            <h2 className="text-xl font-semibold mb-3">Booking Summary</h2>

            {loading ? (
              <p className="text-sm">Loading summary...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <div className="text-sm space-y-2">
                <h3 className="border-t pt-3 font-semibold">
                  Destination: {lodgingName}
                </h3>

                <p className="border-t pt-3">
                  Reserving Room {roomNumber} - {roomTypeName}
                </p>

                <h3 className="border-t pt-3 font-semibold">
                  Number of Guests
                </h3>
                <p>Number of Adults: {adults}</p>
                <p>Number of Children: {children}</p>
                <p>Total Number of Guests: {guests}</p>

                <h3 className="border-t pt-3 font-semibold">
                  Check-in and Check-out Dates
                </h3>
                <p>Check-in: {checkIn}</p>
                <p>Check-out: {checkOut}</p>

                <h3 className="border-t pt-3 font-semibold">
                  Breakdown of Costs
                </h3>
                <p>Price per Night: {roomPrice} Php</p>
                <p>Number of nights: {nights}</p>
                <p>Original cost: {originalPrice} Php</p>
                <p>Discount code used: {code || "-"}</p>
                <p>Discounted: {Math.round(discountedAmount)} Php</p>

                <h3 className="border-t pt-2 text-[1.6em] font-semibold">
                  Total Cost: {Math.round(finalPrice)} Php
                </h3>
              </div>
            )}
          </div>
        </div>
      </main>
      {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-3">{modalTitle}</h2>

          <p className="text-sm text-slate-700">{modalMessage}</p>

          {isSuccessModal && (
            <p className="mt-4 text-sm text-slate-600">
              Redirecting in <span className="font-semibold">{redirectCountdown}</span>{" "}
              second{redirectCountdown !== 1 ? "s" : ""}...
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            {!isSuccessModal && (
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            )}

            {isSuccessModal && (
              <button
                type="button"
                onClick={() => router.push("/dashboards/user-dashboard")}
                className="rounded bg-black px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Go now
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}