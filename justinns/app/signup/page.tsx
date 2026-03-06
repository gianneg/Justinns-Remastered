"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/Header"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [userType, setUserType] = useState<"0" | "1">("0")
  const [error, setError] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Password not matched!")
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError("Signup succeeded but user id missing.")
      return
    }

    const { error: profileError } = await supabase.from("user").insert({
      user_id: userId,
      firstname: firstName,
      lastname: lastName,
      phone_number: phone,
      is_admin: userType === "1",
      profile_image: null,
    })

    if (profileError) {
      setError(profileError.message)
      return
    }

    router.push("/login")
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-md mt-10 border border-black p-6 rounded">
        <h3 className="text-xl font-semibold mb-4">Create your account</h3>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input className="border border-black px-3 py-2 rounded" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <input className="border border-black px-3 py-2 rounded" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <input className="border border-black px-3 py-2 rounded" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <input
            className="border border-black px-3 py-2 rounded"
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="[0-9]{11}"
          />

          <input className="border border-black px-3 py-2 rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="border border-black px-3 py-2 rounded" type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

          <select
            className="border border-black px-3 py-2 rounded"
            value={userType}
            onChange={(e) => setUserType(e.target.value as "0" | "1")}
          >
            <option value="0">user</option>
            <option value="1">admin</option>
          </select>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="bg-black text-white rounded-full py-2">
            Register
          </button>

          <p className="text-sm">
            Already have an account? <Link className="underline" href="/login">login</Link>
          </p>
        </form>
      </main>
    </>
  )
}