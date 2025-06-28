"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, List, Camera, Plus } from "lucide-react"

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
      href: "/harvests",
      label: "Harvests",
      icon: List,
      active: pathname === "/harvests"
    },
    {
      href: "/photos",
      label: "Photos",
      icon: Camera,
      active: pathname === "/photos"
    },
    {
      href: "/harvests/new",
      label: "Add New",
      icon: Plus,
      active: pathname === "/harvests/new",
      variant: "harvest" as const
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