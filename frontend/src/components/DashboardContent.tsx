import * as React from "react"
import { useState, useEffect } from "react"
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
import { PendingOrders } from "./PendingOrders"
import { sellerOrderService, type SellerStats } from "@/lib/seller-orders"
import { Loader2, Package, TrendingUp, Truck, CheckCircle } from "lucide-react"

export function DashboardContent() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await sellerOrderService.getSellerStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

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
          {/* Statistiques vendeur */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-muted-foreground">En préparation</h3>
              </div>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{stats?.pendingOrders || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Commandes à préparer</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-medium text-muted-foreground">Prêt à envoyer</h3>
              </div>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{stats?.readyToSend || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">En attente d'expédition</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-sm font-medium text-muted-foreground">Envoyé</h3>
              </div>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{stats?.sent || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">En cours de livraison</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Revenus</h3>
              </div>
              {loadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Total des ventes</p>
            </div>
          </div>
          {/* Section principale : Commandes en attente d'envoi */}
          <PendingOrders />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


