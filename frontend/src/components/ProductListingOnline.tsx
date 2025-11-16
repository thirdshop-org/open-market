import * as React from "react"
import { useState, useEffect } from "react"
import { productService, type Product } from "@/lib/products"
import { Loader2, Eye, Package, Edit, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ProductListingOnline() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadProducts()
  }, [page])

  const loadProducts = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await productService.getMyProducts(page, 20)
      // Filtrer uniquement les produits "Disponible" (en ligne)
      const onlineProducts = result.items.filter(
        (product) => product.status === "Disponible"
      )
      setProducts(onlineProducts)
      setTotalPages(result.totalPages)
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getConditionBadgeColor = (condition: string) => {
    switch (condition) {
      case "Neuf":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Occasion":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Reconditionné":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
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
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Articles actuellement en ligne
        </CardTitle>
        <CardDescription>
          {products.length} {products.length > 1 ? "produits disponibles" : "produit disponible"} à la vente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Vous n'avez aucun article en ligne pour le moment
            </p>
            <Button asChild>
              <a href="/products/new">Créer une annonce</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead className="text-center">
                      <Eye className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead>Date de mise en ligne</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={productService.getImageUrl(
                              product,
                              product.images[0],
                              "100x100"
                            )}
                            alt={product.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {product.title}
                      </TableCell>
                      <TableCell>
                        {product.expand?.category?.name || "Non catégorisé"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getConditionBadgeColor(product.condition)}
                        >
                          {product.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(product.price, product.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.views || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(product.created)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/products/${product.id}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/products/${product.id}/edit`} target="_blank">
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Retirer de la vente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

