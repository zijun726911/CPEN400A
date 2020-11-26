const crypto = require('crypto');
class SessionError extends Error {};

function SessionManager (){
    // default session length - you might want to
    // set this to something small during development
    const CookieMaxAgeMs = 600000;

    // keeping the session data inside a closure to keep them protected
    const sessions = {};

    // might be worth thinking about why we create these functions
    // as anonymous functions (per each instance) and not as prototype methods
    this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        let token=crypto.randomBytes(32).toString('hex')
        sessions[token]={
            username: username,
            createdTime: Date.now(),

        }
        response.cookie("cpen400a-session",token,{
            maxAge: maxAge
        });

        setTimeout(()=>{
            delete sessions[token]
        },maxAge);

    };

    this.deleteSession = (request) => {
        delete sessions[request.session];
        delete request.username
        delete request.session;

    };

    this.middleware = (request, response, next) => {

        let cookie= request.headers['cookie'];
        for(let kAndV of cookie.split("; ")){
            let arr = kAndV.split("=");
            let key=arr[0];
            let token=arr[1];
            if (key=="cpen400a-session"){
                let sessionObj = sessions[token];
                if (sessionObj){
                   //If the session exists, assign the username associated with the session to a new
                    // username property on the request object passed to the middleware function.
                    // Additionally, assign a property named session and set its value to the cookie value (the token)
                    request.username=sessionObj.username;
                    request.session=token;
                    next()
                    return;

                }else {
                    next(new SessionError("cookie sessions[value] not exist"));
                    return
                }
            }

        }
        next(new SessionError("cookie 'cpen400a-session' not exist"));
        return

    };

    // this function is used by the test script.
    // you can use it if you want.
    this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;