import { parseAsInteger, parseAsString } from 'nuqs'

export const dashboardParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(''),
}
