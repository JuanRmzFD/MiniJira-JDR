import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
}

export function formatRelativeDate(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { locale: es, addSuffix: true })
}

export function formatMonth(month: string): string {
  // month = 'YYYY-MM'
  const [year, m] = month.split('-')
  return format(new Date(Number(year), Number(m) - 1, 1), 'MMM yyyy', { locale: es })
}
