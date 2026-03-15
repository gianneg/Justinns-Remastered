import { supabase } from "@/lib/supabase"

export type LodgingOption = {
  lodging_id: number
  lodging_name: string
}

export type RoomTypeOption = {
  room_type_id: number
  room_type: string
  lodging_id: number
}

export type AvailableRoom = {
  room_id: number
  room_number: string
  room_floor: number
  lodging_id: number
  room_type: string
}

export async function fetchLodgings() {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id, lodging_name")
    .order("lodging_name", { ascending: true })

  if (error) throw error
  return (data ?? []) as LodgingOption[]
}

export async function fetchRoomTypesByLodging(lodgingId: number) {
  const { data, error } = await supabase
    .from("room_type")
    .select("room_type_id, room_type, lodging_id")
    .eq("lodging_id", lodgingId)
    .order("room_type", { ascending: true })

  if (error) throw error
  return (data ?? []) as RoomTypeOption[]
}

export async function fetchAvailableRooms(args: {
  lodgingId: number
  roomTypeId: number
  checkIn: string
  checkOut: string
  guests: number
}) {
  const { data, error } = await supabase.rpc("get_available_rooms", {
    p_lodging_id: args.lodgingId,
    p_room_type_id: args.roomTypeId,
    p_checkin: args.checkIn,
    p_checkout: args.checkOut,
    p_guests: args.guests,
  })

  if (error) throw error
  return (data ?? []) as AvailableRoom[]
}

export function nightsBetween(checkInISO: string, checkOutISO: string) {
  const inD = new Date(checkInISO)
  const outD = new Date(checkOutISO)

  if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) return 0

  const diff = outD.getTime() - inD.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export async function fetchRoomTypePrice(roomTypeId: number) {
  const { data, error } = await supabase
    .from("room_type")
    .select("room_type, room_price")
    .eq("room_type_id", roomTypeId)
    .single()

  if (error) throw error

  return {
    room_type: data?.room_type ?? "",
    room_price: Number(data?.room_price ?? 0),
  }
}

export async function fetchDiscountPercent(code: string) {
  if (!code.trim()) return 0

  const { data, error } = await supabase
    .from("discount")
    .select("discounted_price")
    .eq("discount_code", code.trim())
    .maybeSingle()

  if (error || !data) return 0
  return Number(data.discounted_price ?? 0)
}