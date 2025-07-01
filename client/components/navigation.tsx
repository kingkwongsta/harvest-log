"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavigationProps {
  className?: string
}

export function Navigation({ className = "" }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/gallery",
      label: "Gallery",
      active: pathname === "/gallery"
    },
    {
      href: "/admin",
      label: "Admin",
      active: pathname === "/admin"
    }
  ]

  return (
    <nav className={`flex items-center space-x-2 ${className}`}>
      {navItems.map((item) => {
        return (
          <Link key={item.href} href={item.href}>
            <span className={`text-lg font-medium hover:text-primary transition-colors ${item.active ? "text-primary" : "text-foreground"}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}