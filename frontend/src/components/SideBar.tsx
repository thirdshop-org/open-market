import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Mes annonces",
      url: "#",
      items: [
        {
          title: "En ligne",
          url: "/dashboard/products-online",
        },
      ],
    },
    {
      title: "Mes templates",
      url: "/dashboard/templates",
    },
    {
      title: "Mes commandes",
      url: "#",
      items: [
        {
          title: "En attente de validation",
          url: "/dashboard/orders-pending",
        },
        {
          title: "En attente du vendeur",
          url: "/dashboard/orders-waiting-seller",
        },
      ],
    },
    {
      title: "Mon profil",
      url: "/dashboard/profile",
      items: [
        {
          title: "Mon profil",
          url: "/dashboard/profile",
        },
      ],
    },
    {
      title: "Messages",
      url: "/dashboard/messages",
    },
  ],
}
import { LogoAndBrand } from './LogoAndBrand';  

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex aspect-square size-8 items-center justify-left rounded-lg">
                <LogoAndBrand />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>{subItem.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
