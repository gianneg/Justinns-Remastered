"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")

    if (password !== confirm) {
      setError("Password not matched!")
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      return
    }

    setMsg("Password updated. You can now login.")
    router.push("/login")
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md mt-10 border border-black p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Set a new password</h3>

        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
          <input className="border border-black px-3 py-2 rounded" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="border border-black px-3 py-2 rounded" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {msg && <p className="text-sm">{msg}</p>}

          <button className="bg-black text-white rounded-full py-2">
            Update password
          </button>
        </form>
      </main>
    </>
  )
}