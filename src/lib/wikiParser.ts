export interface WikiProjectData {
  /** All key-value pairs from the # Project Data table */
  fields: Record<string, string>
  /** Raw markdown content from the # Accomplishments section */
  accomplishments: string | null
  /** Raw markdown content from the # Look Ahead section */
  lookAhead: string | null
  /** Raw markdown content from the # Description section */
  description: string | null
}

/**
 * Split markdown into sections keyed by their `# Heading` text.
 * Returns a map of lowercased heading -> body content.
 */
function splitSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  const headingRe = /^#\s+(.+)$/gm
  const matches = [...markdown.matchAll(headingRe)]

  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][1].trim().toLowerCase()
    const bodyStart = matches[i].index! + matches[i][0].length
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index! : markdown.length
    sections.set(heading, markdown.slice(bodyStart, bodyEnd).trim())
  }

  return sections
}

/**
 * Parse a 2-column markdown table (| Field | Value |) into key-value pairs.
 */
function parseTable(body: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = body.split('\n').filter((l) => l.trim().startsWith('|'))

  for (const line of lines.slice(2)) {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean)
    if (cells.length >= 2) {
      result[cells[0]] = cells[1]
    }
  }

  return result
}

/**
 * Parse a ProjectOptics wiki page into structured data.
 * Returns null if the markdown is empty or unparseable.
 */
export function parseWikiPage(markdown: string): WikiProjectData | null {
  if (!markdown.trim()) return null

  const sections = splitSections(markdown)

  const fields = sections.has('project data')
    ? parseTable(sections.get('project data')!)
    : {}

  const accomplishments = sections.get('accomplishments') ?? null
  const lookAheadKey = [...sections.keys()].find((k) =>
    k.startsWith('look ahead'),
  )
  const lookAhead = lookAheadKey ? (sections.get(lookAheadKey) ?? null) : null

  const description = sections.get('description') ?? null

  return { fields, accomplishments, lookAhead, description }
}
