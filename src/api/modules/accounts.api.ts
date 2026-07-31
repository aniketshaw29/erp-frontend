import client from '../client'

// Chart of Accounts
export const getChartOfAccounts = () => client.get('/api/v1/accounts/chart')
export const createAccount = (data: any) => client.post('/api/v1/accounts/accounts', data)
export const updateAccount = (id: string, data: any) => client.put(`/api/v1/accounts/accounts/${id}`, data)
export const deleteAccount = (id: string) => client.delete(`/api/v1/accounts/accounts/${id}`)

// Journal Entries
export const getJournalEntries = (params?: any) => client.get('/api/v1/accounts/journals', { params })
export const getJournalEntry = (id: string) => client.get(`/api/v1/accounts/journals/${id}`)
export const createJournalEntry = (data: any) => client.post('/api/v1/accounts/journals', data)

// Ledger
export const getAccountLedger = (accountId: string, params?: any) =>
  client.get(`/api/v1/accounts/ledger/${accountId}`, { params })
export const getPartyStatement = (partyId: string, params?: any) =>
  client.get(`/api/v1/accounts/party-statement/${partyId}`, { params })

// Outstanding
export const getReceivables = () => client.get('/api/v1/accounts/receivables')
export const getPayables = () => client.get('/api/v1/accounts/payables')
export const getReceivablesAging = () => client.get('/api/v1/accounts/receivables/aging')
export const getPayablesAging = () => client.get('/api/v1/accounts/payables/aging')

// Financial Reports
export const getTrialBalance = (asOf: string) =>
  client.get('/api/v1/reports/trial-balance', { params: { asOf } })
export const getProfitLoss = (from: string, to: string) =>
  client.get('/api/v1/reports/profit-loss', { params: { from, to } })
export const getBalanceSheet = (asOf: string) =>
  client.get('/api/v1/reports/balance-sheet', { params: { asOf } })
export const getCashFlow = (from: string, to: string) =>
  client.get('/api/v1/reports/cash-flow', { params: { from, to } })
export const getDayBook = (date: string) =>
  client.get('/api/v1/reports/day-book', { params: { date } })
