const path = require('path');
const fs = require('fs');
const express = require('express');
const ws  = require('ws');
const crypto = require('crypto');
const broker=new ws.Server({ port: 8000 });
const cpen400a = require('./cpen400a-tester.js');

const Database = require('./Database');	// require the mongodb driver
const SessionManager = require('./SessionManager');	// require the mongodb driver

const db=new Database("mongodb://localhost:27017","cpen400a-messenger")
const sessionManager=new SessionManager();

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


app.use(['/app.js',],sessionManager.middleware,express.static(clientApp + '/app.js'))
//http://forbeslindesay.github.io/express-route-tester/
app.use(['/index','/index.html',/^\/$/i],sessionManager.middleware,express.static(clientApp + '/index.html'))
app.use('/',express.static(clientApp, { extensions: ['html'] }));

app.get('/chat',sessionManager.middleware,async (req,res)=>{
	let chatrooms=await  db.getRooms();

	chatrooms.forEach((chatroom) => {
		chatroom["messages"] = messages[chatroom._id];
	});
	res.send(chatrooms);

});
app.get("/chat/:room_id",sessionManager.middleware,async (req,res)=>{
		let room_id=req.params.room_id;
		let room=await db.getRoom(room_id);
		if(room==null){
			res.status(404).send(`Room ${room_id} was not found`);
		}else {
			res.send(room);
		}


});

app.get("/chat/:room_id/messages",sessionManager.middleware,async (req,res)=>{
	let room_id=req.params.room_id;
	let before=req.query.before;
	let conversation= await db.getLastConversation(room_id,before);


	if(conversation==null){
		res.status(404).send(`conversation with room_id ${room_id} was not found`);
	}else {
		res.send(conversation);

	}

});


app.post("/chat",sessionManager.middleware,async (req,res)=>{
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

app.post("/login",async (req,res)=>{
	let username = req.body.username;
	let password = req.body.password;
	let queryResult=await db.getUser(username)
	if(queryResult){
		if(isCorrectPassword(password,queryResult.password)){
			sessionManager.createSession(res,username)
			res.redirect("/")

		}else {
			res.redirect("/login")
		}

	}else {
		res.redirect("/login")
	}
})

app.get("/logout",sessionManager.middleware,async (req,res)=>{
	sessionManager.deleteSession(req)
	res.redirect("/login")
})

app.get("/profile",sessionManager.middleware,async (req,res)=>{
	res.send({username: req.username})
})

app.use(errorHandler)


app.listen(port, async () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

function isCorrectPassword(password, saltedHash){
	let salt=saltedHash.substring(0,20)
	let gotSaltedHash=saltedHash.substring(20)
	let calculatedSaltedHash=crypto.createHash('sha256').update(password+salt).digest('base64');
	if(calculatedSaltedHash==gotSaltedHash) return true;
	else return false;
}


//https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript
function sanitize(string) {
	const map = {
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		"/": '&#x2F;',
	};
	const reg = /[<>"'/]/ig;
	return string.replace(reg, (match)=>(map[match]));
}

broker.on('connection',(inComingClient,request)=>{


	let cookie= request.headers['cookie'];
	let valid=false;
	let usernameFromCookie=null;
	for(let kAndV of cookie.split("; ")){
		let arr = kAndV.split("=");
		let key=arr[0];
		let token=arr[1];
		if (key=="cpen400a-session"){
			usernameFromCookie=sessionManager.getUsername(token)
			if (usernameFromCookie){
				//https://github.com/websockets/ws
				valid=true
				break
			}

		}
	}
	if (!valid){
		inComingClient.terminate()
		return;
	}


	inComingClient.on('message',  (msg)=> {//// msg have 3 fields: roomId, username, and text.
		let msgObj = JSON.parse(msg);
		msgObj.username=usernameFromCookie;
		msgObj.text=sanitize(msgObj.text);
		msg=JSON.stringify(msgObj)
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




function errorHandler(err, req, res, next){
	if(err instanceof SessionManager.Error){
		if(req.headers['accept']=='application/json'){
			res.status(401).send(err)
		}else {
			res.redirect("/login")
		}
	}else {
		res.sendStatus(500)
	}
}

cpen400a.connect('http://35.183.65.155/cpen400a/test-a5-server.js');
cpen400a.export(__filename, { app, db, messages, messageBlockSize, sessionManager, isCorrectPassword });