"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Header from "@/components/Header"

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.push("/home")
      }
    }

    checkSession()
  }, [router])


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setErrorMessage("Invalid email or password.")
      return
    }

    router.push("/home")
  }

  return (
    <>
      <Header />

      <div className="body-container">

        <h3>
          Have a specific place in mind already? Navigate to their page right now.
        </h3>

        <form onSubmit={handleLogin} className="login-form">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Login
          </button>

        </form>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <select>
          <option>Select a place</option>
        </select>

      </div>
    </>
  )
}