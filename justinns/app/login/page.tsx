"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError("Invalid email or password.")
      return
    }

    const userId = data.user?.id
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single()

      if (profile?.is_admin) router.push("/dashboards/admin-dashboard")
      else router.push("/dashboards/user-dashboard")
      return
    }

    router.push("/home")
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-md mt-10 border border-black p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Login</h3>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            className="border border-black px-3 py-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="border border-black px-3 py-2 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="bg-black text-white rounded-full py-2">
            Login
          </button>

          <div className="text-sm flex justify-between">
            <Link className="underline" href="/forgot-password">Forgot?</Link>
            <Link className="underline" href="/signup">Sign up</Link>
          </div>
        </form>
      </main>
    </>
  )
}