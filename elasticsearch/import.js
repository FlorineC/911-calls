var elasticsearch = require('elasticsearch');
var csv = require('csv-parser');
var fs = require('fs');

var esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

// Création de l'indice
esClient.indices.create({ index: '911calls' }, (err, resp) => {
  if (err) console.trace(err.message);
  if (!err) {
    createMapping();
  }
});

function createMapping() {
  esClient.indices.putMapping({
    index: '911calls',
    type: 'call',
    body: {
      properties: {
        "pin": {
          "properties": {
            "location": {
              "type": "geo_point"
            }
          }
        },
        "timeStamp": {
          "type": "date",
          "format": "yyyy-MM-dd HH:mm:ss"
        }
      }
    }
  });
}



let calls = [];
fs.createReadStream('../911.csv')
  .pipe(csv())
  .on('data', data => {
    // TODO extract one line from CSV
    calls.push({
      pin: {
        location: {
          lat: data.lat,
          lon: data.lng
        }
      },
      desc: data.desc,
      zip: data.zip,
      title_cat: data.title.split(':')[0],
      title_infos: data.title.split(':')[1],
      timeStamp: data.timeStamp,
      twp: data.twp,
      addr: data.addr
    });
  })
  .on('end', () => {
    // TODO insert data to ES
    esClient.bulk(createBulkInsertQuery(calls), (err, resp) => {
      if (err) console.trace(err.message);
      else console.log(`Inserted ${resp.items.length} calls`);
      esClient.close();
    });
  });
// Fonction utilitaire permettant de formatter les données pour l'insertion "bulk" dans elastic
function createBulkInsertQuery(calls) {
  const body = calls.reduce((acc, call) => {
    const { pin, desc, zip, title_cat, title_infos, timeStamp, twp, addr } = call;
    acc.push({ index: { _index: '911calls', _type: 'call' } })
    acc.push({ pin, desc, zip, title_cat, title_infos, timeStamp, twp, addr })
    return acc
  }, []);

  return { body };
}