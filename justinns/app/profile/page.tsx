import { Suspense } from "react"
import ProfilePageClient from "./ProfilePageClient"

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading profile details...</div>}>
      <ProfilePageClient />
    </Suspense>
  )
}