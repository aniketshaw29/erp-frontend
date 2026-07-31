import { useState } from 'react'

export function usePagination(defaultPage = 1, defaultPageSize = 20) {
  const [page, setPage] = useState(defaultPage)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const onPageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  return {
    page,
    pageSize,
    onPageChange,
  }
}
