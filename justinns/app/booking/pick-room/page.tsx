import { Suspense } from "react"
import PickPageClient from "./PickPageClient"

export default function PickRoomPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading pick room page...</div>}>
      <PickPageClient />
    </Suspense>
  )
}