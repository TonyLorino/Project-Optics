export interface Project {
  id: string
  name: string
  description: string | null
  state: string
  visibility: string
  isArchived: boolean
}

export interface Team {
  id: string
  name: string
  projectName: string
  projectId: string
}
