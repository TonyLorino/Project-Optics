import axios from 'axios'
import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION } from '@/lib/constants'
import { parseWikiPage, type WikiProjectData, type WikiConflictError } from '@/lib/wikiParser'

interface ADOWiki {
  id: string
  name: string
  type: 'projectWiki' | 'codeWiki'
}

interface ADOWikiPage {
  content?: string
  path: string
}

interface ADOWikiPageInfo {
  path: string
  subPages?: ADOWikiPageInfo[]
}

const WIKI_PAGE_NAME = 'ProjectOptics'

function getLeafName(path: string): string {
  const segments = path.split('/')
  return segments[segments.length - 1] ?? ''
}

function findPagesByName(tree: ADOWikiPageInfo, targetName: string): string[] {
  const matches: string[] = []
  const target = targetName.toLowerCase()

  function walk(node: ADOWikiPageInfo): void {
    if (getLeafName(node.path).toLowerCase() === target) {
      matches.push(node.path)
    }
    if (node.subPages) {
      for (const child of node.subPages) {
        walk(child)
      }
    }
  }

  walk(tree)
  return matches
}

/**
 * Fetch and parse the ProjectOptics wiki page for a given project.
 * Searches the entire wiki tree for a page named ProjectOptics (or
 * ProjectOptics-{areaName}). Returns a conflict error if multiple
 * pages share the same name.
 */
export async function fetchProjectWikiData(
  projectName: string,
  areaName?: string | null,
): Promise<WikiProjectData | WikiConflictError | null> {
  const encoded = encodeURIComponent(projectName)
  const targetPageName = areaName ? `${WIKI_PAGE_NAME}-${areaName}` : WIKI_PAGE_NAME

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

  let pageTree: ADOWikiPageInfo
  try {
    const treeUrl = `/${encoded}/_apis/wiki/wikis/${projectWiki.id}/pages?path=/&recursionLevel=full&api-version=${ADO_API_VERSION}`
    const { data } = await adoClient.get<ADOWikiPageInfo>(treeUrl)
    pageTree = data
    console.debug(`[Wiki] ${projectName}: fetched page tree`)
  } catch (err) {
    console.warn(`[Wiki] ${projectName}: failed to fetch wiki page tree`, err)
    return null
  }

  const matchedPaths = findPagesByName(pageTree, targetPageName)
  console.debug(`[Wiki] ${projectName}: searching for "${targetPageName}", found ${matchedPaths.length} match(es)`, matchedPaths)

  if (matchedPaths.length === 0) {
    console.debug(`[Wiki] ${projectName}: page "${targetPageName}" not found anywhere in wiki`)
    return null
  }

  if (matchedPaths.length > 1) {
    console.warn(`[Wiki] ${projectName}: multiple pages named "${targetPageName}" found`, matchedPaths)
    return { conflict: true, paths: matchedPaths }
  }

  const pagePath = matchedPaths[0]!
  let page: ADOWikiPage
  try {
    const pageUrl = `/${encoded}/_apis/wiki/wikis/${projectWiki.id}/pages?path=${encodeURIComponent(pagePath)}&includeContent=true&api-version=${ADO_API_VERSION}`
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
