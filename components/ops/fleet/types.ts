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

export type Operator = {
  id: string
  name: string
  icaoCode: string | null
  iataCode: string | null
  callsign: string | null
  country: string | null
}