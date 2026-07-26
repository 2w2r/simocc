export type Aircraft = {
  id: string
  registration: string
  icaoCode: string
  operator: {
    name: string
    icaoCode: string | null
    iataCode: string | null
  }
}