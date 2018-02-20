var mongodb = require('mongodb');
var csv = require('csv-parser');
var fs = require('fs');

var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/911-calls';

var emptyToNull = function(str) {
    return (str && str.trim() !== "") ? str : null;
  }

var buildLocation = function(data) {
    var lon = emptyToNull(data["lng"]);
    var lat = emptyToNull(data["lat"]);
    return lon && lat ? [ parseFloat(lon), parseFloat(lat) ] : null;
  }

var insertCalls = function(db, callback) {
    var collection = db.collection('calls');

    var calls = [];
    fs.createReadStream('../911.csv')
        .pipe(csv())
        .on('data', data => {
            var call = {
                "location": { "type": "Point", "coordinates" : buildLocation(data) },
                "desc": data.desc,
                "zip": data.zip,
                "title": data.title,
                "timeStamp": data.timeStamp,
                "twp": data.twp,
                "addr": data.addr
            }; // TODO créer l'objet call à partir de la ligne
            calls.push(call);
        })
        .on('end', () => {
          collection.insertMany(calls, (err, result) => {
            callback(result)
          });
        });
}

MongoClient.connect(mongoUrl, (err, db) => {
    insertCalls(db, result => {
        console.log(`${result.insertedCount} calls inserted`);
        db.close();
    });
});
