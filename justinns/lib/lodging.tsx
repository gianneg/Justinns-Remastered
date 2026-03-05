import { supabase } from "@/lib/supabase"

export type LodgingRow = {
  lodging_id: string | number
  lodging_name: string
  lodging_location: string
  Image_Path: string | null
  Avg_Rating: number
  Total_Ratings: number
  lodging_type: string
}

export async function getLodgingData(lodgingType: string) {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id, lodging_name, lodging_location, Image_Path, Avg_Rating, Total_Ratings, lodging_type")
    .eq("Lodging_Type", lodgingType)
    .order("Name", { ascending: true })

  if (error) throw error
  return (data ?? []) as LodgingRow[]
}