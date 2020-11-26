var LobbyView=function (lobby){
    var htmlString=`<div class="content">
                  <ul class="room-list">
                    <li><a href="#/chat">Everyone in CPEN400A</a> </li>
                    <li><a href="#/chat"> Foodies only</a> </li>
                    <li><a href="#/chat">Gamers unite </a> </li>
                  </ul>
                  <div class="page-control">
                    <input type="text" placeholder="Room Title"/> <button>Create Room</button>
                  </div>
               </div>`;

    this.lobby=lobby;
    this.elem=createDOM(htmlString);
    this.listElem=this.elem.querySelector("ul.room-list");
    this.inputElem=this.elem.querySelector("input");

    this.buttonElem=this.elem.querySelector("button");

    this.lobby.onNewRoom= (room)=> {
        this.redrawList();
        // this.listElem.appendChild(
        //     createDOM(`<li><a href="#/chat/${room.id}">${room.name}</a> </li>`)
        // );


    };

    this.buttonElem.addEventListener("click", ()=>{
        let roomName=this.inputElem.value;
        var data={
            name: roomName,
            image: "assets/everyone-icon.png"
        }
        Service.addRoom(data).then((room)=>{
            this.lobby.addRoom( room._id, room.name, room.image,[]);
        }).catch((e)=>{
            console.log(e);
        });


        this.inputElem.value=""

    })

    this.redrawList();

};

LobbyView.prototype.redrawList=function () {
    emptyDOM(this.listElem);
    for(var id in this.lobby.rooms ){
        var room=this.lobby.rooms[id]
        this.listElem.appendChild(
            createDOM(`<li><a href="#/chat/${id}">${room.name}</a> </li>`));
    };


};

var ChatView=function (socket){
    var htmlString=`<div class="content">
                        <h4 class="room-name">Everyone in CPEN400A</h4>
                        <div class="message-list">
                        </div>
                        
                        <div class="page-control">
                            <textarea></textarea>
                            <button>Send</button>
                        </div>
                  </div>`;


    this.socket=socket;
    this.room=null;

    this.elem=createDOM(htmlString);
    this.titleElem=this.elem.querySelector("h4.room-name");
    this.chatElem=this.elem.querySelector("div.message-list");
    this.inputElem=this.elem.querySelector("textarea");
    this.buttonElem=this.elem.querySelector("button");



    this.buttonElem.addEventListener("click", ()=>{
       this.sendMessage()
    });
    this.inputElem.addEventListener("keyup",  (e)=> {
        if(e.code == "Enter" && !e.shiftKey){
            this.sendMessage();

        }
    });

    this.chatElem.addEventListener('wheel',(e)=>{
        //https://piazza.com/class/kecc4tzxnau2o3?cid=637
        //https://www.w3schools.com/jsref/prop_element_scrolltop.asp
        if (e.deltaY<0
            &&this.room.canLoadConversation==true
            && this.chatElem.scrollTop==0 ){

            this.room.getLastConversation.next();

        }
    })

};
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
ChatView.prototype.sendMessage=function() {
    let text = this.inputElem.value;

    this.room.addMessage(profile.username, text);
    this.socket.send(JSON.stringify({
        roomId: this.room.id,
        username: profile.username,
        text: text
    }))
    this.inputElem.value="";
};

ChatView.prototype.setRoom= function (room) {
    this.room=room;
    this.titleElem.innerText=this.room.name;

    emptyDOM(this.chatElem);
    this.room.messages.forEach(
        (message)=>{

            var myMessageClass="";
            if(message['username']==profile.username){
                myMessageClass="my-message";
            }

            this.chatElem.appendChild(createDOM(
                ` <div class="message ${myMessageClass}">
                                <span class="message-user"><b>${message['username']}</b></span><br/>
                                <span class="message-text">${message['text']}</span>
                            </div>` ));

        });

    this.room.onNewMessage=(message)=>{
        var myMessageClass="";
        if(message['username']==profile.username){
            myMessageClass="my-message";
        }

        this.chatElem.appendChild(createDOM(
            ` <div class="message ${myMessageClass}">
                                <span class="message-user"><b>${message['username']}</b></span><br/>
                                <span class="message-text">${sanitize(message['text'])}</span>
                            </div>` ));
    };

    this.room.onFetchConversation=(conversation)=>{
        let hb=this.chatElem.scrollHeight;
        let str="";
        let children=[];

        for (let i = 0; i < conversation.messages.length; i++) {
            let message= conversation.messages[i];
            let myMessageClass="";
            if(message['username']==profile.username){
                myMessageClass="my-message";
            }


            children.push(createDOM(
                `<div class="message ${myMessageClass}">
                <span class="message-user"><b>${message['username']}</b></span><br/>
                <span class="message-text">${message['text']}</span>
            </div>`)) ;

        }
        this.chatElem.prepend(...children);

        // this.chatElem.appendChild(createDOM(str));


        let ha=this.chatElem.scrollHeight;
        //https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_element_scrollleft
        this.chatElem.scrollTop=ha - hb;


    }
};

var ProfileView=function (){
    var htmlString='<div class="content">\n' +
        '                <div class="profile-form">\n' +
        '                    <div class="form-field">\n' +
        '                        <label>Username</label><input type="text">\n' +
        '                    </div>\n' +
        '                    <div class="form-field">\n' +
        '                        <label>Password</label><input type="password">\n' +
        '                    </div>\n' +
        '                    <div class="form-field">\n' +
        '                        <label>Avatar Image</label><input type="file">\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div class="page-control">\n' +
        '                    <button>Save</button>\n' +
        '                </div>\n' +
        '            </div>';
    this.elem=createDOM(htmlString);
};

var Room = function (id, name, image, messages){
    this.id=id;
    this.name=name;
    this.image= (image==undefined||image=="")? "assets/everyone-icon.png": image;
    this.messages= (messages==undefined) ? []:messages ;
    this.canLoadConversation= true;
    this.createdTime=Date.now();
    this.getLastConversation = makeConversationLoader(this);
}

Room.prototype.addMessage= function (username, text){
    if(text.trim()=="") return;

    var message={
        'username': username,
        'text': sanitize(text)
    }
    this.messages.push(message);
    if(this.onNewMessage){
        this.onNewMessage(message);
    }
};

Room.prototype.addConversation=function (conversation) {

    this.messages.unshift(...conversation.messages)

    if( this.onFetchConversation){
        this.onFetchConversation(conversation)

    }
}

var Lobby=function(){

    this.rooms={};

};

Lobby.prototype.addRoom= function (id, name, image, messages) {
    var room = new Room(id,name,image,messages);
    this.rooms[id]=room;

    if(this.onNewRoom){
        this.onNewRoom(room);
    }
};

Lobby.prototype.getRoom=function (roomId) {
    return this.rooms[roomId];
};


var profile={
    username:"username"
}

var Service={
    origin: window.location.origin,
    getAllRooms:   ()=> {

        var url=Service.origin + "/chat";

        return fetch(url).then( (response) =>{
            // return  response.json();

                if (response.ok){

                    return  response.json();
                } else{

                    return  response.text().then((text) => {
                        throw new Error(text);
                    });

                }
            });

    },

    addRoom:  (data)=>{//
         let  url=Service.origin + "/chat";
         let opts={
             body: JSON.stringify(data),
             method:'POST',
             headers: {
                 'content-type': 'application/json'
             },
         };

         return fetch(url,opts).then((response)=>{
             // return  response.json();
             if (response.ok){

                 return  response.json()
             } else{

                 return  response.text().then((text) => {
                     throw new Error(text);
                 });

             }
         });



    },


    getLastConversation:(roomId, before)=>{
        if (before){
            var  url=Service.origin + `/chat/${roomId}/messages?before=${before}`;
        }else {
            var  url=Service.origin + `/chat/${roomId}/messages`;

        }
        return fetch(url).then((response)=>{
            if (response.ok){

                return  response.json();
            } else{

                return  response.text().then((text) => {
                    throw new Error(text);
                });

            }
        });
    },

    getProfile: ()=>{
        let  url=Service.origin + `/profile`;

        return fetch(url).then((response)=>{
            if (response.ok){
                return  response.json();
            } else{
                return  response.text().then((text) => {
                    throw new Error(text);
                });

            }
        })
    }
}

function * makeConversationLoader(room){


    let lastTimestamp=room.createdTime;
    while (room.canLoadConversation){
        room.canLoadConversation=false;
        yield Service.getLastConversation(room.id,lastTimestamp).then((conversation)=>{
            if (conversation!=null){
                lastTimestamp=conversation.timestamp;
                room.addConversation(conversation);
                room.canLoadConversation=true;

                return  conversation;

            }else {
                room.canLoadConversation=false;
                return null;

            }
        })

    }


}

window.addEventListener('load',main);

function main() {



    var lobby=new Lobby();
    var lobbyView=new LobbyView(lobby);
    Service.getProfile().then(res=>{
        profile.username = res.username;
    })




    var socket=new WebSocket("ws://localhost:8000")

    socket.addEventListener("message",(event)=>{
        var msg = JSON.parse(event.data);// msg have 3 fields: roomId, username, and text.


        var room = lobby.getRoom(msg.roomId);
        room.addMessage(msg.username,msg.text)

    });

    var chatView=new ChatView(socket);
    var profileView=new ProfileView();



    function renderRoute(){
        var hash = window.location.hash; //   #/chat/2


        if (hash==""||hash=="#"||hash=="#/"){
            refreshLobby();
            var pageView = document.getElementById("page-view");
            emptyDOM(pageView);
            pageView.appendChild(lobbyView.elem);
        }else {
            var pathArr = hash.split("/");
            switch (pathArr[1]) {
                case "chat" :
                    var pageView = document.getElementById("page-view");
                    var roomId=pathArr[2];

                    var room=lobby.getRoom(roomId);
                    if(room!=null&&room!=undefined){
                        chatView.setRoom(room);
                    }else {
                        throw "Room is not exist"
                    }



                    emptyDOM(pageView);
                    pageView.appendChild(chatView.elem);


                    break;

                case "profile" :
                    var pageView = document.getElementById("page-view");


                    emptyDOM(pageView);
                    pageView.appendChild(profileView.elem);
                    break;

                default: console.error("routing error");
            }
        }

    }


    function refreshLobby(){
        Service.getAllRooms().then((rooms)=>{
            for (let room of rooms){
                if(lobby.rooms[room._id]){
                    lobby.rooms[room._id].name=room.name;
                    lobby.rooms[room._id].image=room.image;

                }else{//add new room
                    lobby.addRoom(room._id,room.name,room.image,room.messages);

                }

            }
        }).catch((e)=>{
            console.log(e);
        });
    }

    window.addEventListener("popstate", renderRoute);

    refreshLobby();
    renderRoute();
    setInterval(refreshLobby,100000);



    cpen400a.export(arguments.callee,
        { chatView,lobby,Service,main });

};


//helper

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
};

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
};
