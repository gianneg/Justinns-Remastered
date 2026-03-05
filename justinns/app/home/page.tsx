"use client"

import Header from "@/components/Header"

export default function HomePage() {
  return (
    <>
      <Header />

      <div className="flex justify-center mt-10">
        <div className="flex flex-col items-center gap-4 border border-black p-6">

          <h3 className="text-lg text-center">
            Have a specific place in mind already? Navigate to their page right now.
          </h3>

          <div className="flex gap-3 items-center">

            <select className="border border-black px-3 py-2 rounded">
              <option>Select lodging</option>
              <option value="Hotel">Hotel</option>
              <option value="Inn">Inn</option>
              <option value="Pension House">Pension House</option>
            </select>

            <button className="bg-black text-white px-4 py-2 rounded-full">
              Go
            </button>

          </div>

        </div>
      </div>
    </>
  )
}