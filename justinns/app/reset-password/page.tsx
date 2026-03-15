import { Suspense } from "react"
import ResetPageClient from "./ResetPageClient"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading reset password form...</div>}>
      <ResetPageClient />
    </Suspense>
  )
}