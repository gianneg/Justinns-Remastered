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

export type FavoriteRow = {
  favorite_id: number
  lodging_id: number
  Name: string
  lodging_type: string
}

async function getCurrentAppUserId() {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!authData.user) throw new Error("User not authenticated.")

  const { data: userRow, error: userError } = await supabase
    .from("user")
    .select("user_id")
    .eq("auth_id", authData.user.id)
    .single()

  if (userError) throw userError
  if (!userRow) throw new Error("User record not found.")

  return userRow.user_id as number
}

export async function getMyFavorites() {
  const userId = await getCurrentAppUserId()

  const { data, error } = await supabase
    .from("favorites")
    .select(`
      favorite_id,
      lodging_id,
      lodging:lodging_id (
        lodging_name,
        lodging_type
      )
    `)
    .eq("user_id", userId)
    .order("favorite_id", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    favorite_id: row.favorite_id,
    lodging_id: row.lodging_id,
    Name: row.lodging?.lodging_name ?? "",
    lodging_type: row.lodging?.lodging_type ?? "",
  })) as FavoriteRow[]
}

export async function addToFavorites(lodgingId: number) {
  const userId = await getCurrentAppUserId()

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    lodging_id: lodgingId,
  })

  if (error) throw error

  return {
    success: true,
    message: "Lodging added to favorites.",
    isFavorite: true,
  }
}

export async function removeFromFavorites(lodgingId: number) {
  const userId = await getCurrentAppUserId()

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("lodging_id", lodgingId)

  if (error) throw error

  return {
    success: true,
    message: "Lodging removed from favorites.",
    isFavorite: false,
  }
}

export async function isFavorite(lodgingId: number) {
  const userId = await getCurrentAppUserId()

  const { data, error } = await supabase
    .from("favorites")
    .select("favorite_id")
    .eq("user_id", userId)
    .eq("lodging_id", lodgingId)
    .maybeSingle()

  if (error) throw error

  return Boolean(data)
}

export type UserProfileRow = {
  user_id: number
  firstname: string
  lastname: string
  email: string
  phone_number: string | null
}

export async function fetchMyProfile() {
  const userId = await getCurrentAppUserId()

  const { data, error } = await supabase
    .from("user")
    .select("user_id, firstname, lastname, email, phone_number")
    .eq("user_id", userId)
    .single()

  if (error) throw error

  return {
    user_id: data.user_id,
    firstname: data.firstname,
    lastname: data.lastname,
    email: data.email,
    phone_number: data.phone_number ?? "",
  } as UserProfileRow
}

export async function fetchMyProfileImage() {
  const userId = await getCurrentAppUserId()

  const { data, error } = await supabase
    .from("user_images")
    .select("file_path, file_name")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error

  if (!data?.file_path) {
    return {
      file_path: "",
      file_name: "",
    }
  }

  const { data: publicData } = supabase.storage
    .from("images")
    .getPublicUrl(data.file_path)

  return {
    file_path: publicData.publicUrl,
    file_name: data.file_name ?? "",
  }
}

export async function updateMyProfile(args: {
  fname: string
  lname: string
  email: string
  phone: string
}) {
  const userId = await getCurrentAppUserId()

  const { error } = await supabase
    .from("user")
    .update({
      FirstName: args.fname,
      LastName: args.lname,
      Email: args.email,
      Phone_Number: args.phone,
    })
    .eq("user_id", userId)

  if (error) throw error

  return "Profile updated successfully."
}

export async function uploadMyProfileImage(file: File, firstName: string, lastName: string) {
  const userId = await getCurrentAppUserId()

  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const safeName = `${firstName}${lastName}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

  const fileName = `${safeName}.${ext}`
  const filePath = `pfp/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data: existing, error: existingError } = await supabase
    .from("user_images")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    const { error: updateError } = await supabase
      .from("user_images")
      .update({
        file_path: filePath,
        file_name: fileName,
      })
      .eq("User_ID", userId)

    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from("user_images")
      .insert({
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
      })

    if (insertError) throw insertError
  }

  const { data: publicData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath)

  return publicData.publicUrl
}