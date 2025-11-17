import * as React from "react"
import { useState, useEffect } from "react"
import { 
  fetchUserTemplates, 
  deleteTemplate, 
  countTemplateCustomFields,
  type Template 
} from "@/lib/templates"
import { pb } from "@/lib/pocketbase"
import { 
  Loader2, 
  Package, 
  Edit, 
  Trash2, 
  Plus, 
  FileText,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [templateFieldCounts, setTemplateFieldCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    setError("")

    try {
      const currentUser = pb.authStore.model
      if (!currentUser) {
        setError("Vous devez être connecté")
        setLoading(false)
        return
      }

      const fetchedTemplates = await fetchUserTemplates(currentUser.id)
      setTemplates(fetchedTemplates)

      // Charger le nombre de champs pour chaque template
      const counts: Record<string, number> = {}
      for (const template of fetchedTemplates) {
        counts[template.id] = await countTemplateCustomFields(template.id)
      }
      setTemplateFieldCounts(counts)
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des templates")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${title}" ?`)) {
      return
    }

    try {
      await deleteTemplate(id)
      setTemplates(templates.filter((t) => t.id !== id))
    } catch (err: any) {
      alert("Erreur lors de la suppression: " + (err?.message || "Erreur inconnue"))
    }
  }

  const handleUseTemplate = (templateId: string) => {
    // Rediriger vers la page de création de produit avec le template
    window.location.href = `/products/new?template=${templateId}`
  }

  const getImageUrl = (template: Template) => {
    if (template.images && template.images.length > 0) {
      return pb.files.getUrl(template, template.images[0], { thumb: '200x200' })
    }
    return '/placeholder-product.jpg'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mes templates</h2>
          <p className="text-muted-foreground">
            Créez des templates pour réutiliser vos configurations de produits
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Créer un template
          </a>
        </Button>
      </div>

      {/* Liste des templates */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">Aucun template</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Créez votre premier template pour réutiliser facilement vos configurations de produits.
              </p>
              <Button asChild className="mt-6">
                <a href="/dashboard/templates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer mon premier template
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image du template */}
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={getImageUrl(template)}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1.5">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {templateFieldCounts[template.id] || 0} champ(s)
                  </Badge>
                  <Badge variant="outline">
                    {template.condition}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {template.price} {template.currency}
                  </p>
                  <p className="mt-1 text-xs">
                    Créé le {new Date(template.created).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Utiliser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/dashboard/templates/${template.id}/edit`}>
                      <Edit className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info sur les templates */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            À propos des templates
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Les templates vous permettent de gagner du temps en réutilisant vos configurations de produits.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Créez un template avec vos champs personnalisés</li>
            <li>Utilisez-le pour créer rapidement de nouveaux produits</li>
            <li>Les champs seront pré-remplis avec les valeurs par défaut</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

