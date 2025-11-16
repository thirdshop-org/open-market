import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./SideBar"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

export function DashboardContent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">
                  Accueil
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground">Ventes totales</h3>
              <p className="mt-2 text-3xl font-bold">2,543</p>
              <p className="text-xs text-muted-foreground mt-1">+12% ce mois-ci</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground">Revenus</h3>
              <p className="mt-2 text-3xl font-bold">45,231 €</p>
              <p className="text-xs text-muted-foreground mt-1">+8% ce mois-ci</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground">Clients actifs</h3>
              <p className="mt-2 text-3xl font-bold">1,234</p>
              <p className="text-xs text-muted-foreground mt-1">+23% ce mois-ci</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm md:col-span-4">
              <h3 className="text-lg font-semibold mb-4">Aperçu des ventes</h3>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Graphique des ventes (à intégrer)
              </div>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm md:col-span-3">
              <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Nouvelle commande</p>
                    <p className="text-xs text-muted-foreground">Jean Dupont a passé une commande</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Il y a 5m</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">ML</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Nouveau message</p>
                    <p className="text-xs text-muted-foreground">Marie Leblanc a envoyé un message</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Il y a 12m</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">PA</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Paiement reçu</p>
                    <p className="text-xs text-muted-foreground">Pierre André a effectué un paiement</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Il y a 1h</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">SB</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Nouvel utilisateur</p>
                    <p className="text-xs text-muted-foreground">Sophie Bernard s'est inscrite</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Il y a 2h</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Produits populaires</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-muted"></div>
                    <div>
                      <p className="font-medium">Produit A</p>
                      <p className="text-sm text-muted-foreground">Catégorie: Électronique</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">145 ventes</p>
                    <p className="text-sm text-muted-foreground">4,350 €</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-muted"></div>
                    <div>
                      <p className="font-medium">Produit B</p>
                      <p className="text-sm text-muted-foreground">Catégorie: Mode</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">132 ventes</p>
                    <p className="text-sm text-muted-foreground">3,960 €</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-muted"></div>
                    <div>
                      <p className="font-medium">Produit C</p>
                      <p className="text-sm text-muted-foreground">Catégorie: Maison</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">98 ventes</p>
                    <p className="text-sm text-muted-foreground">2,940 €</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

