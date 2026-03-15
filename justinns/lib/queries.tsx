import { supabase } from "@/lib/supabase"

function slugifyLodgingName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getLodgingTypeFolder(lodgingType: string) {
  const normalized = lodgingType.trim().toLowerCase()

  if (normalized === "hotel" || normalized === "hotels") return "hotels"
  if (
    normalized === "pension" ||
    normalized === "pensions" ||
    normalized === "pension house" ||
    normalized === "pension houses"
  ) {
    return "pensions"
  }
  if (normalized === "inn" || normalized === "inns") return "inns"

  return "hotels"
}

function getLodgingCoverImageUrl(lodgingName: string, lodgingType: string) {
  const typeFolder = getLodgingTypeFolder(lodgingType)
  const lodgingFolder = slugifyLodgingName(lodgingName)

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(`lodgings/${typeFolder}/${lodgingFolder}/image1.png`)

  return data.publicUrl
}

export type LodgingCard = {
  lodging_id: number
  image_path: string | null
  name: string
  location: string
  avg_rating: number
  total_ratings: number
  avg_room_price: number
  lodging_type: string
}

export async function getLodgingData(lodgingType: string) {
  const { data, error } = await supabase
    .from("lodging_list_view")
    .select("lodging_id, name, location, avg_rating, total_ratings, avg_room_price, lodging_type")
    .eq("lodging_type", lodgingType)

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    lodging_id: row.lodging_id,
    image_path: getLodgingCoverImageUrl(row.name, row.lodging_type || lodgingType),
    name: row.name,
    location: row.location,
    avg_rating: row.avg_rating,
    total_ratings: row.total_ratings,
    avg_room_price: row.avg_room_price,
    lodging_type: row.lodging_type,
  })) as LodgingCard[]
}

export type LodgingDetails = {
  id: number
  name: string
  location: string
  description: string | null
  avg_rating: number
  total_ratings: number
}

export async function getLodgingDetails(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_details_view")
    .select("id, name, location, description, avg_rating, total_ratings")
    .eq("name", lodgingName)
    .single()

  if (error) throw error
  return data as LodgingDetails
}

export async function getLodgingRatingStats(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_details_view")
    .select("avg_rating, total_ratings")
    .eq("name", lodgingName)
    .single()

  if (error) throw error
  return data as { avg_rating: number; total_ratings: number }
}

export type LodgingImage = { File_Path: string; File_Name: string | null }

export async function getLodgingImagesByName(lodgingName: string) {
  const { data: lod, error: lodErr } = await supabase
    .from("lodging")
    .select("lodging_id")
    .eq("lodging_name", lodgingName)
    .single()

  if (lodErr) throw lodErr
  return getLodgingImagesById(Number(lod.lodging_id))
}

export async function getLodgingImagesById(lodgingId: number) {
  const { data, error } = await supabase
    .from("lodging_images")
    .select("file_path, file_name")
    .eq("lodging_id", lodgingId)

  if (error) throw error

  return (data ?? []).map((x: any) => ({
    File_Path: x.file_path,
    File_Name: x.file_name ?? null,
  })) as LodgingImage[]
}

export type RoomTypeRow = {
  Room_Type_ID: number
  Room_Type: string
  Max_Persons: number
  Room_Description: string | null
  Room_Price: number
  room_image_path: string | null
}

export async function getAvailableRooms(lodgingName: string) {
  const lodging = await getLodgingDetails(lodgingName)

  const { data, error } = await supabase
    .from("lodging_roomtypes_view")
    .select("room_type_id, room_type, max_persons, room_description, room_price, room_image_path, lodging_id")
    .eq("lodging_id", lodging.id)

  if (error) throw error

  return (data ?? []).map((x: any) => ({
    Room_Type_ID: x.room_type_id,
    Room_Type: x.room_type,
    Max_Persons: x.max_persons,
    Room_Description: x.room_description ?? null,
    Room_Price: x.room_price,
    room_image_path: x.room_image_path ?? null,
  })) as RoomTypeRow[]
}

/** Reviews */
export type ReviewRow = {
  User: number | null
  file_path: string | null
  FirstName: string | null
  LastName: string | null
  Review_Title: string
  Review_Comment: string
  Rating_Score: number
  Review_Date: string
}

export async function getLodgingReviews(lodgingName: string) {
  const lodging = await getLodgingDetails(lodgingName)

  const { data, error } = await supabase
    .from("lodging_reviews_view")
    .select(`User, file_path, FirstName, LastName, Review_Title, Review_Comment, Rating_Score, Review_Date`)
    .eq("lodging_id", lodging.id)
    .order("Review_Date", { ascending: false })

  if (error) throw error
  return (data ?? []) as ReviewRow[]
}

export async function getAllLodgings() {
  const { data, error } = await supabase.from("lodging").select("*")
  if (error) throw error
  return data ?? []
}

export async function insertLodging(args: {
  name: string
  location: string
  description: string
  type: string
  adminId: number
}) {
  const { data: existing } = await supabase
    .from("lodging")
    .select("lodging_id")
    .eq("lodging_name", args.name)
    .maybeSingle()

  if (existing?.lodging_id) {
    throw new Error("Error: A lodging with this name already exists.")
  }

  const { data, error } = await supabase
    .from("lodging")
    .insert({
      lodging_name: args.name,
      lodging_location: args.location,
      lodging_description: args.description,
      lodging_type: args.type,
      admin_id: args.adminId,
    })
    .select("lodging_id")
    .single()

  if (error) throw error
  return data.lodging_id as number
}

export async function updateLodging(args: {
  lodgingId: number
  name: string
  location: string
  description: string
  type: string
  adminId: number
}) {
  const { error } = await supabase
    .from("lodging")
    .update({
      lodging_name: args.name,
      lodging_location: args.location,
      lodging_description: args.description,
      lodging_type: args.type,
      admin_id: args.adminId,
    })
    .eq("lodging_id", args.lodgingId)

  if (error) throw error
  return "Lodging updated successfully."
}

export async function getLodgingID(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id")
    .eq("lodging_name", lodgingName)
    .single()

  if (error) throw error
  return data.lodging_id as number
}

export async function getAllRooms(lodgingId: number) {
  const { data, error } = await supabase
    .from("room")
    .select("room_id, room_number, room_floor")
    .eq("lodging_id", lodgingId)
    .order("room_number", { ascending: true })

  if (error) throw error
  return data ?? []
}

export type LodgingOption = {
    lodging_id: number
    lodging_name: string
  }
  
  export type RoomTypeOption = {
    room_type_id: number
    room_type: string
    lodging_id: number
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

export async function addRoomType(args: {
  typename: string
  description: string
  persons: number
  price: number
  imagePath: string | null
  lodgingId: number
}) {
  const { error } = await supabase.from("room_type").insert({
    room_type: args.typename,
    room_description: args.description,
    max_persons: args.persons,
    room_price: args.price,
    room_image_path: args.imagePath,
    lodging_id: args.lodgingId,
  })

  if (error) throw error
  return "Room type added successfully!"
}

export async function updateRoomType(args: {
  typename: string
  description: string
  persons: number
  price: number
  imageUrl: string | null
  lodgingId: number
}) {
  const { error } = await supabase
    .from("room_type")
    .update({
      room_type: args.typename,
      room_description: args.description,
      max_persons: args.persons,
      room_price: args.price,
      room_image_path: args.imageUrl,
    })
    .eq("lodging_id", args.lodgingId)

  if (error) throw error
  return "Room type updated successfully."
}

/** BOOKINGS (admin) */
export type BookingRow = {
  Booking_ID: number
  Room_Number: string
  Booked_By: string | number
  CheckIn_Date: string
  CheckOut_Date: string
  Lodging_Name: string
  Payment_Bank: string
  Created_At: string
}

export async function getAllBookings(limit = 30) {
  const { data, error } = await supabase
    .from("bookings_list_view")
    .select("*")
    .order("Created_At", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as BookingRow[]
}

export type NotificationRow = {
  Booked_By: string | number
  CheckIn_Date: string
  CheckOut_Date: string
  Status: string
  Room_Number: string
  Lodging_Name: string
  Payment_Bank: string
  Created_At: string
}

export async function getNotifications(limit = 10) {
  const { data, error } = await supabase
    .from("notifications_view")
    .select("*")
    .order("Created_At", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as NotificationRow[]
}

export type MyReviewRow = {
  Review_Title: string
  Review_Comment: string
  Rating_Score: number
  Created_at: string
  Lodging_Name: string
}

export async function getMyReviews() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not logged in")

  // assumes review.user_id stores supabase auth user id (uuid)
  const { data, error } = await supabase
    .from("review")
    .select(`
      review_title,
      review_comment,
      rating_score,
      created_at,
      lodging:lodging_id ( lodging_name )
    `)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    Review_Title: r.review_title,
    Review_Comment: r.review_comment,
    Rating_Score: r.rating_score,
    Created_at: r.created_at,
    Lodging_Name: r.lodging?.lodging_name ?? "",
  })) as MyReviewRow[]
}

export async function getLodgingById(lodgingId: number) {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id, lodging_name")
    .eq("lodging_id", lodgingId)
    .single()

  if (error) throw error
  return data as { lodging_id: number; lodging_name: string }
}