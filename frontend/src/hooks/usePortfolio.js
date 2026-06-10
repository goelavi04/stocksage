import { useQuery } from '@tanstack/react-query'
import { portfolioAPI } from '../services/api'

export const usePortfolio = () =>
  useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioAPI.getPortfolio().then((r) => r.data),
  })

export const usePortfolioAnalysis = () =>
  useQuery({
    queryKey: ['portfolio', 'analysis'],
    queryFn: () => portfolioAPI.analysePortfolio().then((r) => r.data),
  })
