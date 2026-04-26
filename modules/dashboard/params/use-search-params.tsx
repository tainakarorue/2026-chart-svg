import { useQueryStates } from 'nuqs'
import { dashboardParsers } from './index'

export const useSearchParams = () => {
  return useQueryStates(dashboardParsers)
}
