"use client"

import Header from "@/components/Header"

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-center">
          <section className="w-full max-w-3xl border border-black p-6 rounded-lg">
            
            <h1 className="text-2xl font-semibold mb-6 text-center">
              About JustInns
            </h1>

            <div className="text-sm leading-relaxed space-y-4 text-center">
              
              <p>
                JustInns is a demo web application created to showcase a fully
                functional lodging browsing experience. Users can explore
                different accommodations, view details, and navigate through the
                platform as if using a real booking system.
              </p>

              <p>
                This project was developed by{" "}
                <span className="font-medium">
                  Gianne Guenter Gaudan
                </span>{" "}
                as a demonstration of modern web development using React,
                Next.js, and Supabase.
              </p>

              <p>
                While the platform is fully functional in terms of navigation
                and data display, it does not process real bookings or
                transactions. Any booking-related features are for demonstration
                purposes only.
              </p>

            </div>
          </section>
        </div>
      </main>
    </>
  )
}