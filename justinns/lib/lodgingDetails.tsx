import { supabase } from "@/lib/supabase"

export type LodgingDetails = {
  lodging_id: string | number
  lodging_name: string
  lodging_location: string
  lodging_description: string | null
}

export type LodgingImage = {
  File_Path: string
}

export type RoomRow = {
  Room_Type: string
  Max_Persons: number
}

export type ReviewRow = {
  Rating_Score: number
  Review_Title: string
  Review_Comment: string
  anon: number
  FirstName: string | null
  LastName: string | null
  file_path: string | null
}

export type RatingStats = {
  Avg_Rating: number
  Total_Ratings: number
}

export async function fetchLodgingDetailsByName(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id, lodging_name, lodging_location, lodging_description")
    .eq("Name", lodgingName)
    .single()

  if (error) throw error
  return data as LodgingDetails
}

export async function fetchRatingStats(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_rating_stats")
    .select("Avg_Rating, Total_Ratings")
    .eq("Lodging_Name", lodgingName)
    .single()

  if (error) {
    return { Avg_Rating: 0, Total_Ratings: 0 } as RatingStats
  }

  return data as RatingStats
}

export async function fetchLodgingImages(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_images")
    .select("File_Path")
    .eq("Lodging_Name", lodgingName)

  if (error) throw error
  return (data ?? []) as LodgingImage[]
}

export async function fetchAvailableRooms(lodgingName: string) {
  const { data, error } = await supabase
    .from("room")
    .select("Room_Type, Max_Persons")
    .eq("Lodging_Name", lodgingName)
    .eq("Is_Available", true)

  if (error) throw error
  return (data ?? []) as RoomRow[]
}

export async function fetchLodgingReviews(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_reviews_view")
    .select("Rating_Score, Review_Title, Review_Comment, anon, FirstName, LastName, file_path")
    .eq("Lodging_Name", lodgingName)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ReviewRow[]
}