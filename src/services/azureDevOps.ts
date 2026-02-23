import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 1_000

/**
 * Authenticated axios client for the Azure DevOps REST API.
 *
 * In development the Vite proxy rewrites `/api/ado/*` to
 * `https://dev.azure.com/<org>/*` and injects the PAT on the
 * server side so the token never leaves the backend process.
 */
export const adoClient = axios.create({
  baseURL: '/api/ado',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface RetryMeta { _retryCount?: number }

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

adoClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & RetryMeta) | undefined
    const status = error.response?.status

    if (status === 401) {
      console.error('[ADO] Unauthorized – check your PAT token')
    } else if (status === 403) {
      console.error('[ADO] Forbidden – PAT may lack required scopes')
    } else if (status === 429 && config) {
      const retryCount = config._retryCount ?? 0
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1
        const retryAfter = Number(error.response?.headers?.['retry-after']) || 0
        const delay = retryAfter > 0
          ? retryAfter * 1_000
          : BASE_BACKOFF_MS * 2 ** retryCount
        console.warn(`[ADO] Rate limited – retry ${config._retryCount}/${MAX_RETRIES} in ${delay}ms`)
        await sleep(delay)
        return adoClient(config)
      }
      console.error('[ADO] Rate limited – retries exhausted')
    }

    return Promise.reject(error)
  },
)
