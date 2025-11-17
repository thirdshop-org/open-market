PRODUCTS : 
{
  "collectionId": "pbc_4092854851",
  "collectionName": "products",
  "id": "test",
  "title": "test",
  "description": "test",
  "price": 123,
  "currency": "EUR",
  "images": [
    "filename.jpg"
  ],
  "category": "RELATION_RECORD_ID",
  "condition": "Neuf",
  "seller": "RELATION_RECORD_ID",
  "status": "Vendu",
  "location": "test",
  "views": 123,
  "reference": "test",
  "compatibility": "test",
  "availableFrom": "2022-01-01 10:00:00.123Z",
  "availableUntil": "2022-01-01 10:00:00.123Z",
  "quantity": 123,
  "minStockAlert": 123,
  "parentId": "RELATION_RECORD_ID",
  "created": "2022-01-01 10:00:00.123Z",
  "updated": "2022-01-01 10:00:00.123Z"
}


Un template est un produit qui n'a pas de parentId.

Actuellement il y a des champs dans produits comme condition, category etc ... qui sont dans produit mais à terme il faudra les migrer vers la table fields

FIELDS
{
  "collectionId": "pbc_885227877",
  "collectionName": "fields",
  "id": "test",
  "label": "test",
  "parentId": "RELATION_RECORD_ID",
  "isDefault": true,
  "createdByAdmin": true,
  "created": "2022-01-01 10:00:00.123Z",
  "updated": "2022-01-01 10:00:00.123Z"
}


Le parent id permet de faire référence à un parent représentant un champ parent exemple : référence -> référence-interne

ProductFields 
{
  "collectionId": "pbc_8852278772",
  "collectionName": "productsFields",
  "id": "test",
  "productId": "RELATION_RECORD_ID",
  "fieldId": "RELATION_RECORD_ID",
  "isVisibleByClients": true,
  "fieldValue": "test",
  "defaultFieldValue": "test",
  "created": "2022-01-01 10:00:00.123Z",
  "updated": "2022-01-01 10:00:00.123Z"
}

L'objectif c'est d'associer des champs à des produits.



Comment cela doit fonctionner ?
Par default il y a un product template dans la base de données administrer par le super user qui représente le template mère qui n'est editable que par le superadmin avec des champs obligatoire pour créer une annonce sur le site.

Ensuite chaque vendeur pourra créer des templates de produits et ou créer une annonce et ajouter des champs à ceux obligatoires.

Donc dans le dashboard seller il va faloir ajouter une nouvelle page de gestion des templates.

Sur la page tu dois avoir de lister les templates de l'utilisateur si il y a en a et pouvoir en créer.

Lors de la création tu as déjà les elements obligatoires, images, titres de l'annonce, état ( qui doit etre un product fields du super user ), prix ( qui doit etre un product fields du super user ), devise ( qui doit etre un product fields du super user ), statut ( qui doit etre un product fields du super user ).