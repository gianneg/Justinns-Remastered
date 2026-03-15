import { Suspense } from "react"
import LodgingDetailsPageClient from "./LodgingDetailsPageClient"

export default function LodgingDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading lodging details...</div>}>
      <LodgingDetailsPageClient />
    </Suspense>
  )
}