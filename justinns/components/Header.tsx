"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Header() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const profileImage =
    user?.user_metadata?.avatar_url ||
    "https://simplyilm.com/wp-content/uploads/2017/08/temporary-profile-placeholder-1.jpg"

  return (
    <header className="navbar">

      <Link href="/home">
        <Image
          src="/assets/general-images/logo.png"
          alt="logo"
          width={120}
          height={40}
        />
      </Link>

      <div className="links">
        <Link href="/lodging?lodging_type=Hotel">Hotels</Link>
        <Link href="/lodging?lodging_type=Inn">Inns</Link>
        <Link href="/lodging?lodging_type=Pension%20House">Pension</Link>
        <Link href="/booking">Book Now</Link>
      </div>

      {!user ? (

        <button
          id="signin"
          onClick={() => router.push("/login")}
        >
          Sign in
        </button>

      ) : (

        <div className="loggedin-dropdown">

          <button
            id="loggedin"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <i className="fa-solid fa-bars"></i>

            <Image
              src={profileImage}
              alt="profile"
              width={30}
              height={30}
              style={{ borderRadius: "50%" }}
            />
          </button>

          {dropdownOpen && (
            <ul id="user-dropdown">

              <li>
                <Link href="/profile">Profile</Link>
              </li>

              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>

              <li>
                <Link href="/favorites">Favorites</Link>
              </li>

              <li>
                <button onClick={handleLogout}>
                  Logout
                </button>
              </li>

            </ul>
          )}

        </div>

      )}

    </header>
  )
}