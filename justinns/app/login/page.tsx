import { Suspense } from "react"
import LodgingPageClient from "./LodgingPageClient"

export default function LodgingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading lodging details...</div>}>
      <LodgingPageClient />
    </Suspense>
  )
}