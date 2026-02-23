import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION } from '@/lib/constants'

interface ADOClassificationNode {
  id: number
  name: string
  structureType: string
  hasChildren: boolean
  children?: ADOClassificationNode[]
}

/**
 * Fetch area path classification nodes for a project.
 * Returns the names of immediate child areas (not the root node itself).
 * Projects with no sub-areas return an empty array.
 */
export async function fetchAreaPaths(
  projectName: string,
): Promise<string[]> {
  const encoded = encodeURIComponent(projectName)

  try {
    const { data } = await adoClient.get<ADOClassificationNode>(
      `/${encoded}/_apis/wit/classificationnodes/areas?$depth=2&api-version=${ADO_API_VERSION}`,
    )

    if (!data.children || data.children.length === 0) return []

    return data.children.map((child) => child.name).sort()
  } catch (err) {
    console.warn(`[AreaPaths] ${projectName}: failed to fetch area paths`, err)
    return []
  }
}
