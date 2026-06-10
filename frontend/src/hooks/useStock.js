import { useQuery } from '@tanstack/react-query'
import { stockAPI } from '../services/api'

export const useStockQuote = (symbol) =>
  useQuery({
    queryKey: ['stock', 'quote', symbol],
    queryFn: () => stockAPI.getQuote(symbol).then((r) => r.data),
    enabled: !!symbol,
  })

export const useStockHistory = (symbol, period) =>
  useQuery({
    queryKey: ['stock', 'history', symbol, period],
    queryFn: () => stockAPI.getHistory(symbol, period).then((r) => r.data),
    enabled: !!symbol,
  })

export const useStockIndicators = (symbol) =>
  useQuery({
    queryKey: ['stock', 'indicators', symbol],
    queryFn: () => stockAPI.getIndicators(symbol).then((r) => r.data),
    enabled: !!symbol,
  })

export const useStockFundamentals = (symbol) =>
  useQuery({
    queryKey: ['stock', 'fundamentals', symbol],
    queryFn: () => stockAPI.getFundamentals(symbol).then((r) => r.data),
    enabled: !!symbol,
  })

export const useStockRecommendation = (symbol) =>
  useQuery({
    queryKey: ['stock', 'recommendation', symbol],
    queryFn: () => stockAPI.getRecommendation(symbol).then((r) => r.data),
    enabled: !!symbol,
  })
