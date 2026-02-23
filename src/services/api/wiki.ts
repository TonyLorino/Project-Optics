import axios from 'axios'
import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION } from '@/lib/constants'
import { parseWikiPage, type WikiProjectData } from '@/lib/wikiParser'

interface ADOWiki {
  id: string
  name: string
  type: 'projectWiki' | 'codeWiki'
}

interface ADOWikiPage {
  content?: string
  path: string
}

const WIKI_PAGE_BASE = '/ProjectOptics'

/**
 * Fetch and parse the ProjectOptics wiki page for a given project.
 * When areaName is provided, looks for /ProjectOptics-{areaName} instead.
 * Returns null if the project has no wiki or the page doesn't exist.
 */
export async function fetchProjectWikiData(
  projectName: string,
  areaName?: string | null,
): Promise<WikiProjectData | null> {
  const encoded = encodeURIComponent(projectName)
  const pagePath = areaName ? `${WIKI_PAGE_BASE}-${areaName}` : WIKI_PAGE_BASE

  let wikis: ADOWiki[]
  try {
    const { data } = await adoClient.get<{ value: ADOWiki[] }>(
      `/${encoded}/_apis/wiki/wikis?api-version=${ADO_API_VERSION}`,
    )
    wikis = data.value
    console.debug(`[Wiki] ${projectName}: found ${wikis.length} wiki(s)`, wikis.map((w) => ({ name: w.name, type: w.type, id: w.id })))
  } catch (err) {
    console.warn(`[Wiki] ${projectName}: failed to list wikis`, err)
    return null
  }

  const projectWiki = wikis.find((w) => w.type === 'projectWiki')
  if (!projectWiki) {
    console.debug(`[Wiki] ${projectName}: no projectWiki found (types: ${wikis.map((w) => w.type).join(', ')})`)
    return null
  }

  let page: ADOWikiPage
  const pageUrl = `/${encoded}/_apis/wiki/wikis/${projectWiki.id}/pages?path=${encodeURIComponent(pagePath)}&includeContent=true&api-version=${ADO_API_VERSION}`
  try {
    const { data } = await adoClient.get<ADOWikiPage>(pageUrl)
    page = data
    console.debug(`[Wiki] ${projectName}: fetched page at ${pagePath}`, { path: page.path, hasContent: !!page.content, contentLength: page.content?.length })
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      console.debug(`[Wiki] ${projectName}: page ${pagePath} not found (404)`)
      return null
    }
    console.warn(`[Wiki] ${projectName}: failed to fetch page`, err)
    return null
  }

  if (!page.content) {
    console.debug(`[Wiki] ${projectName}: page exists but content is empty`)
    return null
  }

  const parsed = parseWikiPage(page.content)
  console.debug(`[Wiki] ${projectName}: parsed wiki data`, parsed)
  return parsed
}
