'use client'

import Link from 'next/link'
import { SlashIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const MainBreadcrumbs = () => {
  const pathname = usePathname()

  const paths = pathname.split('/').filter((path) => path !== '')

  return (
    <div className="flex items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {paths.map((path, index) => {
            const addPaths = '/' + paths.slice(0, index + 1).join('/')

            if (path === paths[paths.length - 1]) {
              return (
                <div key={path} className="flex items-center gap-2">
                  <BreadcrumbSeparator>
                    <SlashIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">
                      {path}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </div>
              )
            } else {
              return (
                <div key={path} className="flex items-center gap-2">
                  <BreadcrumbSeparator>
                    <SlashIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={addPaths} className="capitalize truncate">
                        {path}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </div>
              )
            }
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
