import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Award, FileText, FolderOpen, Gauge, LogOut } from "lucide-react"
import { Link, useLocation } from "wouter"

const sidebarVariants = cva(
  "flex h-full w-60 flex-col border-r bg-white",
  {
    variants: {
      variant: {
        default: "border-gray-200",
        inset: "border-gray-200 bg-gray-50/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean
}

const SidebarProvider = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        className={cn(sidebarVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-6 border-b border-gray-200", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 p-4 space-y-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 border-t border-gray-200", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean
  }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
        className
      )}
      {...props}
    />
  )
})
SidebarItem.displayName = "SidebarItem"

const AppSidebar = () => {
  const [location, setLocation] = useLocation() // <- top-level hook

  const menuItems = [
    { title: "Overview", url: "/overview", icon: Gauge },
    { title: "Certificate Generator", url: "/certificate-generator", icon: Award },
    { title: "Letter Generator", url: "/letter-generator", icon: FileText },
    { title: "View Documents", url: "/view-documents", icon: FolderOpen },
  ]

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("token")
    // Redirect to login page
    setLocation("/login")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="\tlogo.png" alt="Logo" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tarcin</h1>
            <p className="text-sm text-gray-500">Document Generator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <SidebarItem key={item.title} asChild>
              <Link
                href={item.url}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium",
                  location === item.url && "text-primary bg-blue-50"
                )}
                data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarItem>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarItem asChild>
          <button
            type="button"
            onClick={handleLogout} // <- use top-level function
            className="flex items-center space-x-3 w-full text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors font-medium"
            data-testid="nav-logout"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  )
}

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarProvider,
  AppSidebar,
}
