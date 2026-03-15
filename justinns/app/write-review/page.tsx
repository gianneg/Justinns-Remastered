import { Suspense } from "react"
import WriteReviewPageClient from "./WriteReviewPageClient"

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading review form...</div>}>
      <WriteReviewPageClient />
    </Suspense>
  )
}