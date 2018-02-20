var mongodb = require('mongodb');
var csv = require('csv-parser');
var fs = require('fs');

var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/911-calls';

var emptyToNull = function(str) {
    return (str && str.trim() !== "") ? str : null;
  }

 var buildDate = function(data){
    var year; var month; var day;
    var date = data.timeStamp;
    dateElement = date.split(" ");
    dateElements = dateElement[0].split("-");
    year = parseInt(dateElements[0]);
    month = dateElements[1]-1;
    day = parseInt(dateElements[2]);

    var time = dateElement[1].split(":");
    var hour = parseInt(time[0]);
    var minutes = parseInt(time[1]);
    
    return new Date(year,month,day, hour, minutes)
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
                "timeStamp": buildDate(data),
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
