import { supabase } from "@/lib/supabase"

export type LodgingRow = {
  id: string | number
  Name: string
  Location: string
  Image_Path: string | null
  Avg_Rating: number
  Total_Ratings: number
  Lodging_Type: string
}

export async function getLodgingData(lodgingType: string) {
  const { data, error } = await supabase
    .from("lodging")
    .select("id, Name, Location, Image_Path, Avg_Rating, Total_Ratings, Lodging_Type")
    .eq("Lodging_Type", lodgingType)
    .order("Name", { ascending: true })

  if (error) throw error
  return (data ?? []) as LodgingRow[]
}