"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export default function Header() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (mounted) setUser(data.user ?? null)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
      setOpen(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // close drop down
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return
      if (dropdownRef.current.contains(e.target as Node)) return
      setOpen(false)
    }

    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const profileImage =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    "https://simplyilm.com/wp-content/uploads/2017/08/temporary-profile-placeholder-1.jpg"

  return (
    <header className="flex items-center justify-between py-4">

      {/* Logo */}
      <Link href="/home" className="shrink-0">
        <Image
          src="/assets/general-images/logo.png"
          alt="JustInns"
          width={160}
          height={80}
          className="h-20 w-auto"
          priority
        />
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center justify-between w-87.5">
        <Link className="text-black hover:underline" href="/lodging?lodging_type=Hotel">
          Hotels
        </Link>
        <Link className="text-black hover:underline" href="/lodging?lodging_type=Inn">
          Inns
        </Link>
        <Link
          className="text-black hover:underline"
          href="/lodging?lodging_type=Pension%20House"
        >
          Pension
        </Link>
        <Link className="text-black hover:underline" href="/booking">
          Book Now
        </Link>
      </nav>

      {/* Right side */}
      {!user ? (
        <button
          id="signin"
          onClick={() => router.push("/login")}
          className="px-4 py-3 border border-black rounded-full bg-black text-white text-base"
        >
          Sign in
        </button>
      ) : (
        <div ref={dropdownRef} className="relative">

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="bg-black px-3 py-2 flex items-center justify-center gap-2 cursor-pointer rounded-full w-[78px]"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <i className="fa-solid fa-bars text-white" />
            <Image
              src={profileImage}
              alt="User"
              width={30}
              height={30}
              className="rounded-full"
            />
          </button>

          {/* Dropdown */}
          {open && (
            <ul
              className="absolute right-0 mt-3 w-37.5 bg-white border border-gray-300 shadow-md z-50 p-2"
              role="menu"
            >
              <li className="px-2 py-1">
                <Link className="block text-sm text-black hover:underline" href="/profile">
                  Profile
                </Link>
              </li>

              <li className="px-2 py-1">
                <Link className="block text-sm text-black hover:underline" href="/dashboard">
                  Dashboard
                </Link>
              </li>

              <li className="px-2 py-1">
                <Link className="block text-sm text-black hover:underline" href="/favorites">
                  Favorites
                </Link>
              </li>

              <li className="px-2 py-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-sm text-black hover:underline"
                  role="menuitem"
                >
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