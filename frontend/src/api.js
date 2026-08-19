/**
 * API client — all backend communication lives here.
 *
 * Using axios (over raw fetch) because it gives us:
 *   - onUploadProgress callback with real byte counts for the progress bar
 *   - Automatic JSON response parsing
 *   - Consistent error objects regardless of HTTP status code
 *
 * The base URL is empty ("/") so Vite's proxy handles routing in dev,
 * and a production deploy sets VITE_API_BASE_URL env var to override it.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000, // 30 s for normal requests; upload has its own timeout
})

/**
 * Upload an audio file and return the job_id.
 *
 * @param {File} file - The audio File object from the input element
 * @param {(pct: number) => void} onProgress - Called with 0–100 upload %
 * @returns {Promise<number>} job_id
 */
export async function uploadAudio(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const response = await axios.post(`${BASE_URL}/upload/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // No timeout for uploads — large files can take time
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return response.data.job_id
}

/**
 * Poll job status. Returns the full status object.
 *
 * @param {number} jobId
 * @returns {Promise<object>} job status
 */
export async function getJobStatus(jobId) {
  const response = await api.get(`/jobs/${jobId}`)
  return response.data
}

/**
 * Fetch complete results (transcript + summary) for a completed job.
 *
 * @param {number} jobId
 * @returns {Promise<object>} { job, transcript, summary }
 */
export async function getResults(jobId) {
  const response = await api.get(`/results/${jobId}`)
  return response.data
}
