package main

import (
    "fmt"
    "log"
    "net/http"

    "github.com/pocketbase/dbx"
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

func main() {
    app := pocketbase.New()

    RegisterRoutes(app)

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }

}

type SplitCombination struct {
    ID                  string            `json:"id"`
    ProductId          string            `json:"productId"`
    ProductSplitRuleId string            `json:"productSplitRuleId"`
    Combination        map[string]string `json:"combination"` // fieldName -> value
}

func RegisterRoutes(app *pocketbase.PocketBase) {
    app.OnServe().BindFunc(func(e *core.ServeEvent) error {
        e.Router.GET("/api/products/{id}/combinations", func(c *core.RequestEvent) error {
            productId := c.Request.PathValue("id")
            
            combinations, err := GenerateSplitCombinations(app, productId)
            if err != nil {
                return c.JSON(http.StatusBadRequest, map[string]string{"error": "Failed to generate combinations"})
            }

            return c.JSON(http.StatusOK, combinations)
        })

        return e.Next()
    })
}



type RuleFieldValue struct {
    RuleId     string `db:"ruleId"`
    ProductId  string `db:"productId"`
    Quantity   int    `db:"quantity"`
    FieldId    string `db:"fieldId"`
    FieldName  string `db:"fieldName"`
    FieldValue string `db:"fieldValue"`
}

func GenerateSplitCombinations(app *pocketbase.PocketBase, productId string) ([]SplitCombination, error) {
    query := `
        SELECT 
          psr.id AS ruleId,
          psr.productId,
          f.id AS fieldId,
          f.label AS fieldName,
          pf.value AS fieldValue
        FROM 
          testProductsSplitRules psr,
          json_each(psr.splitByField) AS je
        JOIN 
          testProductsFields pf 
          ON pf.productId = psr.productId 
          AND pf.fieldId = je.value
        JOIN 
          testFields f 
          ON f.id = pf.fieldId
        WHERE
          psr.productId = {:productId}
        ORDER BY 
          psr.id, f.label, pf.value
    `

    rows := []RuleFieldValue{}
    err := app.DB().
        NewQuery(query).
        Bind(dbx.Params{"productId": productId}).
        All(&rows)

    if err != nil {
        fmt.Println(err)
        return nil, err
    }

    fmt.Println(rows)

    // Regrouper par ruleId
    ruleData := make(map[string]*RuleData)
    for _, row := range rows {
        if _, exists := ruleData[row.RuleId]; !exists {
            ruleData[row.RuleId] = &RuleData{
                RuleId:    row.RuleId,
                ProductId: row.ProductId,
                Fields:    make(map[string][]string),
            }
        }
        
        if _, exists := ruleData[row.RuleId].Fields[row.FieldName]; !exists {
            ruleData[row.RuleId].Fields[row.FieldName] = []string{}
        }
        
        ruleData[row.RuleId].Fields[row.FieldName] = append(
            ruleData[row.RuleId].Fields[row.FieldName],
            row.FieldValue,
        )
    }

    // Générer les combinaisons
    var results []SplitCombination
    counter := 1
    
    for _, data := range ruleData {
        combinations := cartesianProduct(data.Fields)
        
        for _, combo := range combinations {
            results = append(results, SplitCombination{
                ID:                  fmt.Sprintf("%d", counter),
                ProductId:          data.ProductId,
                ProductSplitRuleId: data.RuleId,
                Combination:        combo,
            })
            counter++
        }
    }

    return results, nil
}

type RuleData struct {
    RuleId    string
    ProductId string
    Fields    map[string][]string // fieldName -> []values
}

// Produit cartésien
func cartesianProduct(fields map[string][]string) []map[string]string {
    if len(fields) == 0 {
        return []map[string]string{}
    }

    // Convertir map en slices ordonnées
    var fieldNames []string
    var fieldValues [][]string
    
    for name, values := range fields {
        fieldNames = append(fieldNames, name)
        fieldValues = append(fieldValues, values)
    }

    // Générer les combinaisons
    result := []map[string]string{{}}
    
    for i, values := range fieldValues {
        var temp []map[string]string
        for _, combo := range result {
            for _, value := range values {
                newCombo := make(map[string]string)
                for k, v := range combo {
                    newCombo[k] = v
                }
                newCombo[fieldNames[i]] = value
                temp = append(temp, newCombo)
            }
        }
        result = temp
    }

    return result
}
