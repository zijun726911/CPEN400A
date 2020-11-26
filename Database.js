const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
    //https://stackoverflow.com/questions/22211755/function-f-if-this-instanceof-f-return-new-f
    if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
    this.connected = new Promise((resolve, reject) => {
        MongoClient.connect(
            mongoUrl,
            {
                useNewUrlParser: true
            },
            (err, client) => {
                if (err) reject(err);
                else {
                    console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
                    resolve(client.db(dbName));
                }
            }
        )
    });
    this.status = () => this.connected.then(
        db => ({ error: null, url: mongoUrl, db: dbName }),
        err => ({ error: err })
    );
}

Database.prototype.getRooms =async function(){
        let db =await this.connected;
        let rooms= await db.collection("chatrooms").find().toArray();
        return rooms

}

Database.prototype.getUser=async function(username){
    let conn=await this.connected;
    return  await conn.collection("users").findOne({username: username});

}

Database.prototype.getRoom =async function(room_id){
    // https://piazza.com/class/kecc4tzxnau2o3?cid=582
        let db =await this.connected;

        if(room_id instanceof ObjectID){
            //no ambiguity, e.g. ObjectID('5fa73f59f956533d68b4921f')
            return await db.collection("chatrooms").findOne({_id:  room_id});

        }else {
            try {
                //ambiguity, e.g.:
                //'5fa73f59f956533d68b4921f' or ObjectID('5fa73f59f956533d68b4921f')
                var id=new ObjectID(room_id);
                let room=await db.collection("chatrooms").findOne({_id: id});
                if(room==null) {
                    room=await db.collection("chatrooms").findOne({_id: room_id});
                }
                return room;
            }catch (e) {
                //no ambiguity, e.g. "room-2"
               return  await db.collection("chatrooms").findOne({_id: room_id});
            }

        }




}

Database.prototype.addRoom = async function(room){
     const db= await this.connected;


    if(room.name==undefined){
        throw new Error("room name is undefined");
    }else {

        let insertRes=await db.collection("chatrooms").insertOne(room);
         return insertRes.ops[0];
    }
}







Database.prototype.getLastConversation =async function(room_id, before){
    const db= await this.connected;
    if (before){
         before=parseInt(before);
    }else {
        before=Date.now();
    }

    let cursor= db.collection("conversations").find(
        {
            room_id: room_id,
            timestamp: {$lt: before}
        }).sort({timestamp: -1});

    let count =await cursor.count();
    if(count==0){
        return null;
    }else {
        let conversation= await cursor.next();
        await cursor.close();
        return conversation
    }

}

Database.prototype.addConversation =async function(conversation){//conversation is a Conversation object
    const db=await this.connected;

    if(conversation.room_id==undefined
        ||conversation.timestamp==undefined
        ||conversation.messages==undefined){
        throw  new Error("provided info incomplete");
    }else {
        await db.collection("conversations").insertOne(conversation);
        return conversation;
    }
}



module.exports = Database;