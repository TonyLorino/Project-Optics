import type { VercelRequest, VercelResponse } from '@vercel/node'

const ADO_BASE = 'https://dev.azure.com'

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const org = process.env.ADO_ORGANIZATION
  const pat = process.env.ADO_PAT

  if (!org || !pat) {
    res.status(500).json({ error: 'Server misconfigured: missing ADO_ORGANIZATION or ADO_PAT' })
    return
  }

  const method = req.method ?? 'GET'
  if (!ALLOWED_METHODS.has(method)) {
    res.status(405).json({ error: `Method ${method} not allowed` })
    return
  }

  // The rewrite passes the ADO sub-path as ?__path=...
  // Original query params are also forwarded automatically by Vercel.
  const adoPath = (req.query.__path as string) ?? ''

  const url = new URL(req.url!, `https://${req.headers.host}`)
  url.searchParams.delete('__path')
  const qs = url.search.replace(/^\?/, '').replace(/(?:^|&)__path=[^&]*/g, '').replace(/^&/, '')

  const targetUrl = `${ADO_BASE}/${org}/${adoPath}${qs ? `?${qs}` : ''}`

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
    Accept: 'application/json',
  }

  const contentType = req.headers['content-type']
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const hasBody = method !== 'GET' && method !== 'DELETE'
  const body = hasBody && req.body != null
    ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
    : undefined

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
    })

    res.status(upstream.status)

    for (const [key, value] of upstream.headers.entries()) {
      if (!HOP_BY_HOP.has(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    }

    const responseBody = await upstream.text()
    res.send(responseBody)
  } catch (err) {
    console.error('[api/ado] Proxy error:', err)
    res.status(502).json({ error: 'Failed to reach Azure DevOps' })
  }
}
