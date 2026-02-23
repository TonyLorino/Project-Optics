export interface Sprint {
  id: string
  name: string
  path: string
  projectName: string
  startDate: string | null
  finishDate: string | null
  timeFrame: 'past' | 'current' | 'future'
}
