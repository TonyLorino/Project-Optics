import axios from 'axios'

/**
 * Authenticated axios client for the Azure DevOps REST API.
 *
 * In development the Vite proxy rewrites `/api/ado/*` to
 * `https://dev.azure.com/CorporateDataOffice/*` and injects
 * the PAT on the server side so the token never leaves the
 * backend process.
 */
export const adoClient = axios.create({
  baseURL: '/api/ado',
  headers: {
    'Content-Type': 'application/json',
  },
})

adoClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401) {
        console.error('[ADO] Unauthorized – check your PAT token')
      } else if (status === 403) {
        console.error('[ADO] Forbidden – PAT may lack required scopes')
      } else if (status === 429) {
        console.error('[ADO] Rate limited – backing off')
      }
    }
    return Promise.reject(error)
  },
)
