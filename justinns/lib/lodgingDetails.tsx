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
}

export type RatingStats = {
  Avg_Rating: number
  Total_Ratings: number
}

export async function fetchLodgingDetailsByName(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging")
    .select("lodging_id, lodging_name, lodging_location, lodging_description")
    .eq("lodging_name", lodgingName)
    .single()

  if (error) throw error
  return data as LodgingDetails
}

export async function fetchRatingStats(lodgingName: string) {
  const { data, error } = await supabase
    .from("lodging_rating_stats")
    .select(`Avg_Rating, Total_Ratings`)
    .eq("lodging_name", lodgingName)
    .limit(1)

  if (error) throw error

  return (
    data?.[0] ?? {
      Avg_Rating: 0,
      Total_Ratings: 0,
    }
  )
}

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

export async function fetchLodgingImages(
  lodgingName: string,
  lodgingType: string
): Promise<LodgingImage[]> {
  const typeFolder = getLodgingTypeFolder(lodgingType)
  const lodgingFolder = slugifyLodgingName(lodgingName)
  const folderPath = `lodgings/${typeFolder}/${lodgingFolder}`

  console.log("lodgingName =", lodgingName)
  console.log("lodgingType =", lodgingType)
  console.log("typeFolder =", typeFolder)
  console.log("lodgingFolder =", lodgingFolder)
  console.log("folderPath =", folderPath)

  const { data, error } = await supabase.storage
    .from("images")
    .list(folderPath, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    })

  console.log("list data =", data)
  console.log("list error =", error)

  if (error) throw error
  if (!data?.length) return []

  const imageFiles = data.filter(
    (file) =>
      file.name &&
      !file.name.startsWith(".") &&
      /\.(png|jpg|jpeg|webp)$/i.test(file.name)
  )

  const result = imageFiles.map((file) => {
    const fullPath = `${folderPath}/${file.name}`
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fullPath)

    console.log("fullPath =", fullPath)
    console.log("publicUrl =", publicUrlData.publicUrl)

    return {
      File_Path: publicUrlData.publicUrl,
    }
  })

  console.log("final result =", result)

  return result
}

export async function fetchAvailableRooms(lodgingName: string) {
  const { data, error } = await supabase
    .from("room")
    .select(`
      room_type!inner (
        room_type,
        max_persons
      ),
      lodging!inner (
        lodging_name
      )
    `)
    .eq("lodging.lodging_name", lodgingName)
    .eq("is_available", true)

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    Room_Type: r.room_type.room_type,
    Max_Persons: r.room_type.max_persons,
  }))
}

export async function fetchLodgingReviews(lodgingName: string) {
  const { data: lodging, error: lodgingError } = await supabase
    .from("lodging")
    .select("lodging_id")
    .eq("lodging_name", lodgingName)
    .single()

  if (lodgingError) throw lodgingError

  const { data, error } = await supabase
    .from("lodging_reviews_view")
    .select(`
      Rating_Score,
      Review_Title,
      Review_Comment,
      anon,
      FirstName,
      LastName,
      file_path,
      Review_Date
    `)
    .eq("lodging_id", lodging.lodging_id)
    .order("Review_Date", { ascending: false })

  if (error) throw error
  return (data ?? []) as ReviewRow[]
}