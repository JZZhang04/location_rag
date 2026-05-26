export type RagSource = {
  title: string
  url?: string
  snippet: string
}

export type RagFact = {
  label: string
  value: string
}

export type RagPlaceResult = {
  id: string
  name: string
  category: string
  address?: string
  lat?: number
  lng?: number
  summary: string
  whyVisit?: string
  facts?: RagFact[]
  tags?: string[]
  sources: RagSource[]
}
