"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, List } from "lucide-react"

interface NavigationProps {
  className?: string
}

export function Navigation({ className = "" }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/"
    },
    {
      href: "/",
      label: "Harvest Log",
      icon: List,
      active: pathname === "/"
    }
  ]

  return (
    <nav className={`flex items-center space-x-2 ${className}`}>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={item.active ? "default" : (item.variant || "outline")}
              size="sm"
              className={`${item.active ? "border-primary/30" : ""} hover:border-primary/30 transition-colors`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label === "Add New" ? "Add" : item.label}</span>
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}