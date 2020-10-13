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
        this.lobby.addRoom(( Object.keys(this.lobby.rooms).length+1)
                ,this.inputElem.value,"",[]);

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

var ChatView=function (){
    var htmlString=`<div class="content">
                        <h4 class="room-name">Everyone in CPEN400A</h4>
                        <div class="message-list">
                        </div>
                        
                        <div class="page-control">
                            <textarea></textarea>
                            <button>Send</button>
                        </div>
                  </div>`;



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

};

ChatView.prototype.sendMessage=function() {

    this.room.addMessage(profile.username, this.inputElem.value);

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
                                <span class="message-text">${message['text']}</span>
                            </div>` ));
    };

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
}

Room.prototype.addMessage= function (username, text){
    if(text.trim()=="") return;

    var message={
        'username': username,
        'text': text
    }
    this.messages.push(message);
    if(this.onNewMessage){
        this.onNewMessage(message);
    }
};



var Lobby=function(){
    var rooms={};



    rooms["room-1"]=new Room("room-1","room1","",[ {'username': "Bob" , 'text': "room1_msg1"},
                                    {'username': "Alice" , 'text': "room1_msg2"},
                                    {'username': "Bob" , 'text': "room1_msg3"}]);

    rooms["room-2"]=new Room("room-2","room2","",[ {'username': "Bob" , 'text': "room2_msg2"},
                                    {'username': "Alice" , 'text': "room2_msg2"},
                                    {'username': "Bob" , 'text': "room2_msg3"}]);

    rooms["room-3"]=new Room("room-3","room3","",[ {'username': "Bob" , 'text': "room3_msg1"},
                                    {'username': "Alice" , 'text': "room3_msg2"},
                                    {'username': "Bob" , 'text': "room3_msg3"}]);

    this.rooms=rooms;

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
    username:"Alice"
}

window.addEventListener('load',main);

function main() {


    var lobby=new Lobby();
    var lobbyView=new LobbyView(lobby);

    var chatView=new ChatView();
    var profileView=new ProfileView();



    function renderRoute(){
        var hash = window.location.hash; //   #/chat/2
        if (hash==""||hash=="#"||hash=="#/"){
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

    window.addEventListener("popstate", renderRoute);
    renderRoute();



    cpen400a.export(arguments.callee, { renderRoute,
        lobbyView,chatView,profileView,lobby });

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
