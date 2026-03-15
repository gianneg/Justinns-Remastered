"use client"

import Header from "@/components/Header"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  fetchMyProfile,
  fetchMyProfileImage,
  updateMyProfile,
  uploadMyProfileImage,
  type UserProfileRow,
} from "@/lib/queries"

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [profile, setProfile] = useState<UserProfileRow | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [fname, setFname] = useState("")
  const [lname, setLname] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError("")

        const [userData, userImage] = await Promise.all([
          fetchMyProfile(),
          fetchMyProfileImage(),
        ])

        if (cancelled) return

        setProfile(userData)
        setFname(userData.firstname)
        setLname(userData.lastname)
        setEmail(userData.email)
        setPhone(userData.phone_number ?? "")
        setImageUrl(userImage.file_path || "https://via.placeholder.com/150")
      } catch (e: any) {
        if (cancelled) return

        const msg = e?.message || "Failed to load profile."

        if (
          msg.toLowerCase().includes("not authenticated") ||
          msg.toLowerCase().includes("user record not found")
        ) {
          router.push("/login")
          return
        }

        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")

      await updateMyProfile({
        fname,
        lname,
        email,
        phone,
      })

      if (selectedFile) {
        const uploadedUrl = await uploadMyProfileImage(selectedFile, fname, lname)
        setImageUrl(uploadedUrl)
      }

      setEditing(false)
      setSelectedFile(null)

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              FirstName: fname,
              LastName: lname,
              Email: email,
              Phone_Number: phone,
            }
          : prev
      )

      alert("Profile updated successfully.")
    } catch (e: any) {
      setError(e?.message || "Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  function handleChooseFile() {
    if (!editing) return
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)

    if (file) {
      const localPreview = URL.createObjectURL(file)
      setImageUrl(localPreview)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="px-4 py-10">
          <p className="text-sm">Loading profile...</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-3xl font-semibold">User Profile</h1>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <img
                  src={imageUrl || "https://via.placeholder.com/150"}
                  alt="Profile Picture"
                  className="h-36 w-36 rounded-full border object-cover"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={!editing}
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  disabled={!editing}
                  onClick={handleChooseFile}
                  className={`rounded border px-4 py-2 text-sm transition ${
                    editing
                      ? "border-black bg-black text-white hover:bg-white hover:text-black"
                      : "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500"
                  }`}
                >
                  Choose File
                </button>

                <span className="text-sm text-slate-600">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="fname" className="mb-1 block text-sm font-medium">
                First Name:
              </label>
              <input
                id="fname"
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="lname" className="mb-1 block text-sm font-medium">
                Last Name:
              </label>
              <input
                id="lname"
                type="text"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                Phone Number:
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={editing}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                Edit Profile
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboards/user-dashboard")}
                className="rounded border border-black px-4 py-2"
              >
                Back to Dashboard
              </button>

              <button
                type="submit"
                disabled={!editing || saving}
                className="rounded px-4 py-2 border-black border-2 text-black disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}