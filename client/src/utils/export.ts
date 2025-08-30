export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data.length) return

  const headers = columns ? columns.map((col) => col.label) : Object.keys(data[0])

  const rows = data.map((item) => {
    const keys = columns ? columns.map((col) => col.key) : Object.keys(item)
    return keys.map((key) => {
      const value = item[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value).replace(/"/g, '""')
    })
  })

  const csvContent = [
    headers.map((header) => `"${header}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportToJSON<T>(data: T[], filename: string) {
  if (!data.length) return

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function formatExportFilename(prefix: string, format: 'csv' | 'json' = 'csv'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
  return `${prefix}-${timestamp}.${format}`
}
