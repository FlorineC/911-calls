# 911 Calls avec MongoDB

## Import du jeu de données

Pour importer le jeu de données, complétez le script `import.js` (cherchez le `TODO` dans le code :wink:).

Exécutez-le ensuite :

```bash
npm install
node import.js
```

Vérifiez que les données ont été importées correctement grâce au shell (le nombre total de documents doit être `153194`) :

```
use 911-calls
db.calls.count()
```

## Index géographique et index textuel

Afin de répondre aux différents problèmes, vous allez avoir besoin de créer deux index particuliers sur la collection des appels :

* Un index géographique de type `2dsphere` pour les coordonnées GPS des appels.
  * https://docs.mongodb.com/manual/core/2dsphere/#create-a-2dsphere-index
* Un index textuel sur le titre des appels pour pouvoir faire des recherches full-text sur ce champ (recherche des overdoses par exemple)
  * https://docs.mongodb.com/manual/core/index-text/#create-text-index

## Requêtes

À vous de jouer ! Écrivez les requêtes MongoDB permettant de résoudre les problèmes posés.

```
Appels dans les 500 mètres autour de Lansdale :
db.calls.count(
   {
     location: {
        $nearSphere: {
           $geometry: {
              type : "Point",
              coordinates : [ -75.283783, 40.241493 ]
           },
           $minDistance: 0,
           $maxDistance: 500
        }
     }
   }
)

Nombre d'appels par catégorie :
db.calls.count({ title: { $in: [/^EMS:/]}})
db.calls.count({ title: { $in: [/^Fire:/]}})
db.calls.count({ title: { $in: [/^Traffic:/]}})

Les trois mois pendant lesquels il y a eu le plus d'appels :
db.calls.aggregate  ( 
    [
        {
            $group: {
                _id : { month: { $month: "$timeStamp" }, year: { $year: "$timeStamp" } },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                count: -1
            }
        },
        {
            $limit: 3
        }
    ]
)

Les trois villes les plus appelées pour overdose :
db.calls.aggregate (
    [
        {
            $match: {
                $text: {
                $search: "overdose"
                }
            }
            
        },
        {
            $group:{
                _id: "$twp",
                count: {$sum: 1}
            }
        },
        {
            $sort: {
                count: -1
            }
        },
        {
            $limit: 3
        }

    ]
)

```

Vous allez sûrement avoir besoin de vous inspirer des points suivants de la documentation :

* Proximity search : https://docs.mongodb.com/manual/tutorial/query-a-2dsphere-index/#proximity-to-a-geojson-point
* Text search : https://docs.mongodb.com/manual/text-search/#text-operator
* Aggregation Pipeline : https://docs.mongodb.com/manual/core/aggregation-pipeline/
* Aggregation Operators : https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
