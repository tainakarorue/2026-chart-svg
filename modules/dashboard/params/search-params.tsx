import { createLoader } from 'nuqs/server'
import { dashboardParsers } from './index'

export const loadSearchParams = createLoader(dashboardParsers)
