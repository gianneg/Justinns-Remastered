"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg("")
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `justinns.vercel.app/reset-password`,
    })

    if (error) {
      setError(error.message)
      return
    }

    setMsg("If that email exists, a password reset link has been sent.")
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md mt-10 border border-black p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Reset your password</h3>

        <form onSubmit={handleReset} className="flex flex-col gap-3">
          <input
            className="border border-black px-3 py-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {msg && <p className="text-sm">{msg}</p>}

          <button className="bg-black text-white rounded-full py-2">
            Continue
          </button>

          <p className="text-sm">
            <Link className="underline" href="/login">back to JustInns</Link>
          </p>
        </form>
      </main>
    </>
  )
}