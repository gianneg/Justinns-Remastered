"use client"

import { useMemo, useState } from "react"

type Props = {
  onChange?: (payload: {
    checkInISO: string
    checkOutISO: string
    checkInDate: Date | null
    checkOutDate: Date | null
  }) => void
  initialMonth?: number
  initialYear?: number
}

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function toISODate(d: Date | null) {
  if (!d) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateLabel(d: Date | null) {
  if (!d) return ""
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayIndex(month: number, year: number) {
  return new Date(year, month, 1).getDay()
}

export default function DoubleCalendar({
  onChange,
  initialMonth,
  initialYear,
}: Props) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState<number>(
    initialMonth ?? now.getMonth()
  )
  const [currentYear, setCurrentYear] = useState<number>(
    initialYear ?? now.getFullYear()
  )

  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null)

  const checkInISO = useMemo(() => toISODate(checkInDate), [checkInDate])
  const checkOutISO = useMemo(() => toISODate(checkOutDate), [checkOutDate])

  const emitChange = (ci: Date | null, co: Date | null) => {
    onChange?.({
      checkInISO: toISODate(ci),
      checkOutISO: toISODate(co),
      checkInDate: ci,
      checkOutDate: co,
    })
  }

  const handleDateClick = (date: Date) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(date)
      setCheckOutDate(null)
      emitChange(date, null)
      return
    }

    if (date > checkInDate) {
      setCheckOutDate(date)
      emitChange(checkInDate, date)
      return
    }

    setCheckInDate(date)
    setCheckOutDate(null)
    emitChange(date, null)
  }

  const goPrev = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }

  const goNext = () => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  const month2 = (currentMonth + 1) % 12
  const year2 = currentMonth + 1 === 12 ? currentYear + 1 : currentYear

  const isSelected = (date: Date) => {
    if (checkInDate && sameDay(date, checkInDate)) return true
    if (checkInDate && checkOutDate && date >= checkInDate && date <= checkOutDate) return true
    return false
  }

  const Calendar = ({ month, year }: { month: number; year: number }) => {
    const firstDay = getFirstDayIndex(month, year)
    const daysInMonth = getDaysInMonth(month, year)

    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

    return (
      <div className="rounded-lg p-5 w-[280px]">
        <h3 className="text-center text-xl mb-4">
          {monthNames[month]} {year}
        </h3>

        <div className="grid grid-cols-7 text-center border-y border-gray-200 py-2">
          {["S","M","T","W","TH","F","SAT"].map((x) => (
            <div key={x} className="text-sm">{x}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} className="p-2" />

            const selected = isSelected(cell)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(cell)}
                className={[
                  "p-2 text-[1.1em] hover:bg-gray-200",
                  selected ? "bg-gray-200" : "",
                ].join(" ")}
              >
                {cell.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full">
        <button
          type="button"
          onClick={goPrev}
          className="bg-white px-2 rounded-full text-2xl hover:bg-gray-200"
        >
          ←
        </button>

        <button
          type="button"
          onClick={goNext}
          className="bg-white px-2 rounded-full text-2xl hover:bg-gray-200"
        >
          →
        </button>
      </div>

      <div className="flex gap-8 mt-2">
        <Calendar month={currentMonth} year={currentYear} />
        <Calendar month={month2} year={year2} />
      </div>

      <div className="w-full bg-white pt-5 pb-5 border-t border-gray-200 mt-4">
        <div className="flex gap-2 text-sm">
          <span className="ml-5 font-semibold">
            {checkInDate ? formatDateLabel(checkInDate) : "CHECK-IN"}
          </span>
          <span>-</span>
          <span className="font-semibold">
            {checkOutDate ? formatDateLabel(checkOutDate) : "CHECK-OUT"}
          </span>
        </div>

        <input type="hidden" name="checkin_date" value={checkInISO} readOnly />
        <input type="hidden" name="checkout_date" value={checkOutISO} readOnly />
      </div>
    </div>
  )
}