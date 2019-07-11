const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const assert = require('assert');

const CONNECTION_URL = "mongodb+srv://testuser:testuser@cluster0-5vagu.mongodb.net/test?retryWrites=true&w=majority";
const DATABASE_NAME = "FriendManagementDB";

var app = Express();
app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

var database, collection;

app.listen(3000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("friends");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

//get full list
app.get("/friends/getFullList", (request, response) => {
    collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
        console.log(result);
    });
});

//insert initial data in friends collection
app.get("/friends/addDocument", (request, response) => {
    collection.insertOne( {
	        "id": "andy@example.com",
	        "friends": [
	            "john@example.com"
	        ],
	        "subscribe": [
	            "lisa@example.com"
	        ],
	        "follower": [
	        	"tim@example.com"
	        ],
	        "block": [
	            "james@example.com"
	        ]
	    }, function(err, result) {
        assert.equal(err, null);
        response.send(result);
	    console.log("Inserted document into the friends collection.");	   
    });
});

//Update document to make friend connection
app.post("/friends/connect", (request, response) => {  
    var friendA = request.body.friends[0];
    var friendB = request.body.friends[1];
    
    isBlocked(friendA, friendB, function(err, count) {
		if (err) console.log(err);
		if (count == 0){ 
			collection.update(
				{ "id": friendA },
				{
					$addToSet: { "friends" : friendB }
				},
				{ upsert: true }, function(err, results) {
					if (err) console.log(err);
                    response.send(results);
                    console.log(results);
			});
		}		
	});
});     

app.get("/getList1", (request, response) => {
    var query = {email: 'test1@fm.com'}; 
    collection.find(query).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
        console.log(result);
    });
});

app.post("/searchEmail", (request, response) => {  
    var query = {email: 'test1@fm.com'}; 
    console.log(request.query.email);
    collection.find(query).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
        console.log(result);
    });
});   

var isBlocked = function(requestor, target, callback) {
	collection.find({
		"id": target,
		"block": { $in: [ requestor ] }
	}).count(function(err, count) {
        console.log(count);
		return callback(null, count);
	});
};