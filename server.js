const path = require('path');
const fs = require('fs');
const express = require('express');
const ws  = require('ws');
const broker=new ws.Server({ port: 8000 });
const cpen400a = require('./cpen400a-tester.js');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

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
	});
});
let chatrooms=[
	{"id":"room-01", "name":"testRoom1", "image":"assets/everyone-icon.png"},
	{"id":"room-02", "name":"testRoom2", "image":"assets/everyone-icon.png"},
	{"id":"room-03", "name":"testRoom3", "image":"assets/everyone-icon.png"},
	{"id":"room-04", "name":"testRoom4", "image":"assets/everyone-icon.png"}

];

let messages={
	"room-01":[],
	"room-02":[],
	"room-03":[],
	"room-04":[],


};
app.route('/chat')
	.get((req,res)=>{

		let chatroomsWithMsg=JSON.parse(JSON.stringify(chatrooms));
		chatroomsWithMsg.forEach((chatroom)=>{
			chatroom["messages"]=messages[chatroom.id];

		});


		res.send(chatroomsWithMsg);
	})
	.post((req,res)=>{
		let data=req.body;
		if(!data.name){
			res.statusCode=400
			res.send("posted data does not have a name field");
		}else {
			let room={

				id: generateNewRoomId(),
				name: data.name,
				image: (data.image)? data.image: "assets/everyone-icon.png",

			};
			chatrooms.push(room);
			messages[room.id]=[];

			res.send(room)
		}
	})

function generateNewRoomId(){
	return "room-"+chatrooms.length;
}

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


cpen400a.connect('http://35.183.65.155/cpen400a/test-a3-server.js');
cpen400a.export(__filename, { app,chatrooms,messages,broker });