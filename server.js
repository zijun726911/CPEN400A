const path = require('path');
const fs = require('fs');
const express = require('express');
const ws  = require('ws');
const broker=new ws.Server({ port: 8000 });
const cpen400a = require('./cpen400a-tester.js');

const Database = require('./Database');	// require the mongodb driver

const db=new Database("mongodb://localhost:27017","cpen400a-messenger")


function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const messageBlockSize=10;

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));


broker.on('connection',(inComingClient)=>{
	inComingClient.on('message',  (msg)=> {//// msg have 3 fields: roomId, username, and text.
		let msgObj = JSON.parse(msg);
		broker.clients.forEach(
			(client)=>{
				if(client!=inComingClient){
					client.send(msg);
				}
			});
		messages[msgObj.roomId].push(msgObj);

		if(messages[msgObj.roomId].length==messageBlockSize){
			let conversation={
				room_id: msgObj.roomId,
				timestamp: Date.now(),
				messages: messages[msgObj.roomId]
			};

			db.addConversation(conversation).then((conversation)=>{
				messages[msgObj.roomId]=[];
			}).catch((e)=>{
				console.log(e)
			});
		}
	});
});

var messages={};
db.getRooms().then((rooms)=>{

	rooms.forEach((room)=>{
		 messages[room._id]=[];
	});

});




app.get('/chat',async (req,res)=>{
	let chatrooms=await  db.getRooms();

	chatrooms.forEach((chatroom) => {
		chatroom["messages"] = messages[chatroom._id];
	});
	res.send(chatrooms);

});
app.get("/chat/:room_id",async (req,res)=>{
		let room_id=req.params.room_id;
		let room=await db.getRoom(room_id);
		if(room==null){
			res.status(404).send(`Room ${room_id} was not found`);
		}else {
			res.send(room);
		}


});

app.get("/chat/:room_id/messages",async (req,res)=>{
	let room_id=req.params.room_id;
	let before=req.query.before;
	let conversation= await db.getLastConversation(room_id,before);


	if(conversation==null){
		res.status(404).send(`conversation with room_id ${room_id} was not found`);
	}else {
		res.send(conversation);

	}

});


app.post("/chat",async (req,res)=>{
		let room=req.body;
		if(!room.name){
			res.statusCode=400
			res.send("posted data does not have a name field");
		}else {
			try {
				let roomRes=await db.addRoom(room);
				messages[roomRes._id]=[];
				res.send(roomRes)
			}catch (e) {
				res.statusCode=400
				res.send("insert room error"+e.message);
			}

		}
});

app.listen(port, async () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


cpen400a.connect('http://35.183.65.155/cpen400a/test-a4-server.js');
cpen400a.export(__filename, { app,messages,broker, db, messageBlockSize });