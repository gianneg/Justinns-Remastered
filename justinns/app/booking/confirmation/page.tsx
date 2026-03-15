import { Suspense } from "react"
import ConfirmationPageClient from "./ConfirmationPageClient"

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading confirmation page...</div>}>
      <ConfirmationPageClient />
    </Suspense>
  )
}