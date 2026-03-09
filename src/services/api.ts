const API_BASE_URL = import.meta.env.VITE_ORMULUS_API_URL || ''

export interface LeadCaptureData {
  name: string
  email: string
  phone: string
  company: string
  brand_name?: string
  forecast_summary?: string
  forecast_pdf_s3_url?: string
}

export interface LeadCaptureResponse {
  success: boolean
  id: string
}

export async function submitForecastLead(data: LeadCaptureData): Promise<LeadCaptureResponse> {
  const response = await fetch(`${API_BASE_URL}/forecast-leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(
      errorBody?.message || `Failed to submit lead (${response.status})`
    )
  }

  return response.json()
}

export async function patchForecastLeadPdfUrl(id: string, forecast_pdf_s3_url: string): Promise<LeadCaptureResponse> {
  const response = await fetch(`${API_BASE_URL}/forecast-leads`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, forecast_pdf_s3_url }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(
      errorBody?.message || `Failed to patch lead PDF URL (${response.status})`
    )
  }

  return response.json()
}
