import * as React from "react"
import { useState, useEffect } from "react"
import { testProductService, type TestProduct } from "@/lib/test-product-service"
import { authService } from "@/lib/pocketbase"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ProductsDataTable() {
  const [products, setProducts] = useState<TestProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = authService.getCurrentUser()
      
      if (!user) {
        setError("Vous devez être connecté pour voir vos produits")
        return
      }

      const userProducts = await testProductService.getUserProducts(user.id)
      setProducts(userProducts)
    } catch (err: any) {
      console.error("Error loading products:", err)
      setError(err.message || "Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-20">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadProducts}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes Produits</CardTitle>
        <CardDescription>
          Liste de tous vos produits et templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={columns} 
          data={products} 
          searchKey="id"
          searchPlaceholder="Rechercher par ID..."
        />
      </CardContent>
    </Card>
  )
}

