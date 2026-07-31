import client from '../client'

export const getGstConfig = () => client.get('/api/v1/gst/config')
export const updateGstConfig = (data: any) => client.put('/api/v1/gst/config', data)
export const validateGstin = (gstin: string) => client.post(`/api/v1/gst/config/validate-gstin?gstin=${gstin}`)
export const getStateCodes = () => client.get('/api/v1/gst/state-codes')

export const getGstr1Summary = (month: number, year: number) => client.get('/api/v1/gst/returns/gstr1', { params: { month, year } })
export const downloadGstr1Json = (month: number, year: number) => client.get('/api/v1/gst/returns/gstr1/json', { params: { month, year }, responseType: 'blob' })
export const getGstr3bSummary = (month: number, year: number) => client.get('/api/v1/gst/returns/gstr3b', { params: { month, year } })
export const reconcileGstr2a = (month: number, year: number, fileContent: string) => client.post('/api/v1/gst/returns/gstr2a/reconcile', fileContent, { params: { month, year }, headers: { 'Content-Type': 'text/plain' } })

export const generateIrn = (invoiceId: string) => client.post(`/api/v1/gst/einvoice/generate/${invoiceId}`)
export const cancelIrn = (invoiceId: string, data: any) => client.post(`/api/v1/gst/einvoice/cancel/${invoiceId}`, data)
export const getEligibleInvoices = () => client.get('/api/v1/gst/einvoice/eligible')
