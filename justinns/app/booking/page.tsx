import { Suspense } from "react"
import BookingPageClient from "./BookingPageClient"

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading booking page...</div>}>
      <BookingPageClient />
    </Suspense>
  )
}