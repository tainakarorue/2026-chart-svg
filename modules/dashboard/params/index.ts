import { parseAsInteger, parseAsString } from 'nuqs/server'

export const dashboardParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
}
