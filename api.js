// Start
// const firebase = require('firebase-functions');
const http = require('http');
// const https = require('https');
const express = require('express');
const webpush = require('web-push');
// Get meta data from url
const urlMetadata = require('url-metadata')
const PUBLIC_VAPID = 'BASOYyPGsgr_WHDNVvRTBY-9i1TBNeuE2ROQQGO8Q-Z2GsgzvGmMc7B5LKmzjz1ZeG5xEQypJF648HDkgN8tRGQ';
const PRIVATE_VAPID = '4NcVOGJZfkiafugmDSWTQaOAHBP3RSd7oNSGpkNQIWI';

webpush.setVapidDetails('mailto:andrewmuliar7@gmail.com', PUBLIC_VAPID, PRIVATE_VAPID)

const fakeDatabase = []
// const socketIO = require('socket.io');
// const WebSocket = require('ws')


// Secure
const helmet = require('helmet');

//Google AUTH
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = "1080224612439-mijm05g3tdgt7hq4rhah0e5tgv7s9a8e.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// AUTH
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const token_secret = 'token-secret'; // TOKEN SECRET TO SIGN AND VERFIY 

// PARSING
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()

//Hash
const crypto = require('crypto');

// DB
const neo4j = require('neo4j-driver').v1;

// Connect
const url = 'bolt://hobby-elikijibbjimgbkedkeclcbl.dbs.graphenedb.com:24786';
const driver = neo4j.driver(url, neo4j.auth.basic('user-admin', 'b.07cUDad7z50R.FgfXA35jp8FHwzNU'));
const session = driver.session();
// const url = 'bolt://hobby-oicnfgccoamjgbkejncodebl.dbs.graphenedb.com:24786';
// const driver = neo4j.driver(url, neo4j.auth.basic('user-admin', 'b.kalRNFzN1j60.WpqhlGvHNhu7MKs1'));

const app = express();
// Testing connection with sockets. Providing app to socket
const server = http.createServer(app);
// const io = socketIO(server);
app.use(helmet());

app.use(express.static(__dirname + '/public'))
// CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "localhost");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});
// app.use(cors(corsOptions))

app.use(cookieParser());

// const wss = new WebSocket.Server({port:8080})
// wss.on('connection', (connect, info) => {
//     // console.log('info', info.headers)
//     // console.log('info', info.headers.cookie.token)
//     //info.headers.cookie.token='...token='
//     // try{
//     //     const payload = jwt.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDcsImlhdCI6MTU1NDg0MDcxM30.Cy3jmZFa7PywCetU2gsO_OXRhocDIkG9ULUmqv_e2dA', token_secret)
//     //     if(payload){
//     //         console.log('payload', payload)  
//     //     }
//     //     else {
//     //         console.log('Not valid token');
//     //         res.send({response:{data:'not verified'}})
//     //     }
//     // }
//     // catch(err){
//     //     console.log('Credentials error', err);
//     // }
//     connect.room = []
//     console.log('connection...')
//     connect.on('message', message => {
//         // {event:'join', data:{room:1}}
//         const message_object = JSON.parse(message) // parse data to object
//         console.log('message_object', message_object)
//         const event = message_object.event // get action from client
//         switch (event){
//             case 'join':{
//                 connect.room.push(message_object.data.room)
//                 console.log('connect.room', connect.room)
//             break;
//             }
//             case 'message':{
//                 wss.clients.forEach( client => {
//                     if(client.room.indexOf('godlike')> -1){
//                         const a = {result:message_object}
//                         client.send(JSON.stringify(a))
//                     }
//                 })
//             break;
//             }
//         }
//     })
//     // On user disconect
//     connect.on('close', () =>{
//         console.log('disconnected')
//     })
// })

//Custom middleware for cookie detect
function ensureToken(req, res, next){
    console.log('req.cookies ', req.cookies.token)
    if(req.cookies){
        try{
            const payload = jwt.verify(req.cookies.token, token_secret)
            if(payload){
                // console.log('verified');  
                // console.log('padload', payload.id)
                res.locals.userID = payload.id // User ID() in BD
                next()   
            }
            else {
                console.log('Not valid token');
                res.send({response:{data:'not verified'}})
            }
        }
        catch(err){
            console.log('Credentials error', err);
            res.sendStatus(401);
        }
    }
    else res.sendStatus(401)
}

async function verify(userTokenID) {
    const ticket = await client.verifyIdToken({
        idToken: userTokenID,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
}

function isFriend(req, res, next){
    try{
        console.log('Friend middleware', res.locals.id);
        // User himself
        if(req.params.friend_id == 'me' || req.params.friend_id == res.locals.userID){
            console.log('User himself')
            next()
        }
        else{
            // Нада подумать про напрямок дружби!
            session.run(`MATCH (u:User)-[r:FRIENDS]-(f:User) 
                         WHERE ID(u) = ${res.locals.userID} AND
                         ID(f) = ${req.params.friend_id}
                         RETURN f`)
                    .then(data => {
                        session.close()       
                        if(data.records.length > 0){
                            console.log('lentgs of response ', data.records.length)
                            let r = data.records.map(item => item.get(0)['properties'])
                            next()
                        }
                        else{
                            console.log('not friends')
                            res.send({status:'not friends', code:'413'})
                        }  
            })
        }
    }
    catch(err){
        console.log(err)
        res.send({status:`error in 'try' block`, code:'500'})
    }
}
//return if token exist
app.get('/api/checkToken', ensureToken, function(req, res){
    let response = {token:true}
    res.send(response)
})
app.post('/api/login', jsonParser, function(req, res){
    const user = req.body
    console.log('Incoming user', user)
    if(user.googleToken !== undefined){
        console.log('user.googleToken', user.googleToken)
        verify(user.googleToken).then( payload => { // All google info
            if(payload){
                console.log('payload', payload);
                const googleUserID = payload['sub'];
                const googleUserName = payload['name'];
                const googleUserEmail = payload['email'];
                const googleUserPicture = payload['picture'].replace('https://','');
                const session = driver.session();
                // CREATE OR GET EXIST
                // IMAGE ISN OT VISIBLE FROM BROWSE DB, BUT IT EXIST IN TABLE
                session.run(`MERGE (u:User {name:'${googleUserName}', email:'${googleUserEmail}', picture:'${googleUserPicture}', idToken:'${googleUserID}'}) 
                            RETURN u`)
                    .then(data => {
                        session.close()    
                        console.log('return data', data)   
                        console.log('0 record', data.records[0].get(0)['identity']['low'])  
                        let userID = data.records[0].get(0)['identity']['low'] // user ID() from db as token in cookies
                        // console.log('user.id', user.idToken)
                        const user = {id:userID} // for origin data structure;
                        const token = jwt.sign(user, token_secret); //sign for cookies
                        console.log('Token = ', token);
                        // Signed JWT token
                        res.cookie('token', token, {httpOnly:true})
                           .status(200)
                           .send({response:'Вхід успішний'})            
                    })
                    .catch( err => {
                        console.log(err)
                        res.send({reponse:err})
                    })
            }
            else {
                console.log('Verify on creating google token error')
                res.statusCode(401)
            }            
        }).catch( (err) => {
            console.log(err)
            res.send({response:{data:err}})
        })                
    }
    else {
        res.send({response:{data:'User not defined'}})
    }
})

app.get('/api/logout', function(req, res){
    res.clearCookie('token', {httpOnly:true});
    res.send({response:'removed'})
})

app.get('/api/profile/:idUser', ensureToken, function(req, res){
    let userID; // Token of user
    if(req.params.idUser == 'me'){
        userID = res.locals.userID
    } else {
        userID = req.params.idUser
    }
    console.log('USREDID', userID)
    const session = driver.session();
    session.run(`MATCH (u:User) WHERE ID(u) = ${userID}
                 OPTIONAL MATCH (u:User)-[:SKILLED]->(s:Sphere) 
                 RETURN u{.name, .picture, skilled:collect(s)}`).then(data => {
        session.close()    
        let r = data.records[0]['_fields'][0] // take only one record as profile
        res.json(r);   
    })
    .catch( err => {
        res.send(err)
    })
})

app.post('/api/profile', ensureToken, jsonParser, function(req, res){
    const subsciption = req.body
    console.log('our req', req)
    console.log('I have this body from response', subsciption)
    fakeDatabase.push(subsciption)
    res.send({data:"ok"})
})

// Send notification to all
app.get('/sendNotification', (req, res) => {
    const notificationPayload = {"notification": {"title": "message title", "body": "message body"} }
  
    const promises = []
    console.log('FakeDb', fakeDatabase)
    fakeDatabase.forEach(subscription => {
      promises.push(
        webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        )
      )
    })

    Promise.all(promises).then(() => res.sendStatus(200)).catch( err => {
        console.log('Notification error', err)
    })
  })

// app.set('trust proxy', 1) // trust first proxy

app.get('/api/Users', ensureToken, function (req, res) {
    let me = res.locals.userID
    console.log('Me', me)
    const session = driver.session(); // All users, but not me
    session.run(`MATCH (u:User)
                WHERE NOT ID(u) = ${me}   
                RETURN u`).then(data => {
        session.close() 
        console.log('data records', data.records)      
        let r = data.records.map(item => { 
            return {user:item.get(0)['properties'], userID:item.get(0)['identity']['low'] } 
        })
        console.log('R', r)
        res.json(r);   
    })
    .catch( err => {
        res.send(err)
    })
});

// Friends BLOCK
app.get('/api/getFriends/:friend_id', ensureToken, isFriend, function (req, res) {
    let userID;
    console.log('me id', res.locals.userID)
    if(req.params.friend_id == 'me') userID = res.locals.userID
    else userID = req.params.friend_id
    console.log('ID = ',userID)
    session.run(`MATCH (u:User)-[:FRIENDS]->(f:User)-[:FRIENDS]->(u:User)
                WHERE ID(u) = ${userID}
                RETURN DISTINCT f;`)
            .then(data => {
                let r = data.records.map(item => {
                 //Get ID of RECORD
                return {user:item.get(0)['properties'], userID:item.get(0)['identity']['low'] } 
                })
                res.send(r)
            })
            .catch( err => {
                res.send(err)
            })
            .finally(() => {
                console.log('finally');
                session.close()       
            })
})

//get Followers
app.get('/api/getFollowers/:friend_id', ensureToken, isFriend, function (req, res) {
    let userID;
    console.log('me id', res.locals.userID)
    if(req.params.friend_id == 'me') userID = res.locals.userID
    else userID = req.params.friend_id
    console.log('ID = ',userID)
    session.run(`MATCH (u:User)<-[:FRIENDS]-(f:User) 
                WHERE ID(u) = ${userID} AND NOT (u)-[:FRIENDS]->(f)
                RETURN DISTINCT f;`)
            .then(data => {
                let r = data.records.map(item => {
                 //Get ID of RECORD
                return {user:item.get(0)['properties'], userID:item.get(0)['identity']['low'] } 
                })
                res.send(r)
            })
            .catch( err => {
                res.send(err)
            })
            .finally(() => {
                console.log('finally');
                session.close()       
            })
})

//Get followings
app.get('/api/getFollowings/:friend_id', ensureToken, isFriend, function (req, res) {
    let userID;
    console.log('me id', res.locals.userID)
    if(req.params.friend_id == 'me') userID = res.locals.userID
    else userID = req.params.friend_id
    console.log('ID = ',userID)
    session.run(`MATCH (u:User)-[:FRIENDS]->(f:User) 
                WHERE ID(u) = ${userID} AND NOT (u)<-[:FRIENDS]-(f)
                RETURN DISTINCT f;`)
            .then(data => {
                let r = data.records.map(item => {
                 //Get ID of RECORD
                return {user:item.get(0)['properties'], userID:item.get(0)['identity']['low'] } 
                })
                res.send(r)
            })
            .catch( err => {
                res.send(err)
            })
            .finally(() => {
                console.log('finally');
                session.close()       
            })
})

//Add friends connection
app.post('/api/addFriend', jsonParser, ensureToken, function(req, res){
    let friend_id = req.body.id // FRIEND ID in DB
    console.log('Friend id = ', req.body)
    console.log('Friend id = ', friend_id)
    let me = res.locals.userID // idToken
    console.log('I am ', me)
    console.log('Friend is ', friend_id)
    // Create realtion if not alread (maybe need set props to relations)
    session.run(`MATCH (u:User), (u2:User)
                WHERE ID(u) = ${me} AND ID(u2) = ${friend_id} 
                MERGE (u)-[r:FRIENDS]->(u2)
                return r`)
            .then(data => {
                    session.close()
                    let r = data.records.map(item => item.get(0)['properties'])
                    console.log('result', r)
                    res.send(r)
                })
            .catch(err => {
                    console.log('Error', err)
                    res.send({err})
            })
})

// Get friends of friends
app.get('/api/Friends/:id_user1/:id_user2', function (req, res) {

    let prom = session.run(`MATCH (u1:User)-[:FRIENDS]->(r:User)<-[:FRIENDS]-(u2:User)
                            WHERE ID(u1) = ${req.params.id_user1} AND ID(u2) = ${req.params.id_user2}
                            RETURN r;`).then(data => {
        session.close()       
        let r = data.records.map(item => item.get(0)['properties'])
        res.send(r);   
    })
    .catch( err => {
        res.send(err)
    })
});


// END FRIENDS BLOCK
// Link Category block
app.post('/api/linkCategory', jsonParser, ensureToken, function(req, res){
    let me = res.locals.userID
    console.log(req.body)
    session.run(`
                MATCH (u:User) WHERE ID(u) = ${me}
                CREATE(u)-[:link_owner]->(c:linkCategory{name:'${req.body.name}',
                                                    color:'${req.body.color}'}) 
                return c`)
            .then(data => {
                    session.close()
                    let r = data.records.map(item => { return {category:item.get(0)['properties'], category_id:item.get(0)['identity']['low'] }} )
                    console.log('result', r)
                    res.send(r)
                })
            .catch(err => {
                    console.log('Error', err)
                    res.send({err})
            })     
})

app.get('/api/linkCategory', ensureToken, function(req, res){
    let me = res.locals.userID
    session.run(`MATCH (u:User)-[:link_owner]->(c:linkCategory) WHERE ID(u) = ${me} 
                 return DISTINCT c`)
            .then(data => {
                    session.close()
                    let r = data.records.map(item => { return {category:item.get(0)['properties'], category_id:item.get(0)['identity']['low'] }} )
                    console.log('result', r)
                    res.send(r)
                })
            .catch(err => {
                    console.log('Error', err)
                    res.send({err})
            })     
})

//Add links block
app.get('/api/link', ensureToken, function(req, res){
    let me = res.locals.userID // idToken
    session.run(`MATCH(u:User)-[:link_owner]->(c:linkCategory)-[:CHILDREN]->(l:Link)
                WHERE ID(u) = ${me}
                return DISTINCT l, ID(c) as category_id `)
            .then(data => {
                    session.close()
                    // item.get(1)['low'] -- > return category_id
                    let r = data.records.map(item => {return {link:item.get(0)['properties'], category_id:item.get(1)['low']} })
                    res.send(r)
                })
            .catch(err => {
                    console.log('Error', err)
                    res.send({err})
            })    
})

app.post('/api/link', jsonParser, ensureToken, function(req, res){
    urlMetadata(req.body.url).then(function(metadata){
        let me = res.locals.userID // idToken
        const metaImage = metadata['og:image']
        const metaTitle = metadata['og:title']
        // Create realtion if not alread (maybe need set props to relations)
        session.run(`MATCH(u:User), (c:linkCategory) WHERE ID(u) = ${me} AND ID(c) = ${req.body.category_id}
                    CREATE (u)-[:link_owner]->(c)-[:CHILDREN]->(l:Link{ description:'${req.body.description}', 
                                                  url:'${req.body.url}', 
                                                  title:'${metaTitle}',
                                                  image:'${metaImage}' })
                    return l`)
                .then(data => {
                        session.close()
                        let r = data.records.map(item => item.get(0)['properties'])
                        console.log('result', r)
                        res.send({  description:req.body.description, 
                                    url: req.body.url, 
                                    title:metaTitle,
                                    image:metaImage })
                    })
                .catch(err => {
                        console.log('Error', err)
                        res.send({err})
                })        
    },
    function(error){
        console.log(error)
    })
})
// End add link block 

app.get('/api/Skills/:id', function(req, res) {
    
    const session = driver.session();
    session.run(`MATCH (u:User)-[:SKILLED]->(s:Setup) 
                 WHERE ID(u) = ${req.params.id}
                 RETURN s;`).then(data => {
        session.close()       
        // driver.close();
        let r = data.records.map(item => item.get(0)['properties'])
        res.send(r)
    })
    .catch( err => {
        res.send(err)
    })
});

app.get('/api/News', ensureToken, function(req, res) {
                        // Friends direction correct? 
    console.log('user id = ', res.locals.userID);
    const resultPromise = session.run(`MATCH (u:User)-[:FRIENDS]->(f:User)-[:OWNER]->(p:POST)
                                        WHERE ID(u) = ${res.locals.userID}
                                        RETURN f, p`);
    // need format date to normal date Format
    resultPromise.then(data => {
        let r = data.records.map( item => {
            return {user:{user:item.get(0)['properties'], userID:item.get(0)['identity']['low']}, post:item.get(1)['properties'] }  
        })
    console.log('result', r);
    res.send(r);
    })
    .catch(err => {
        console.log('error in request', err)
    })
    .finally( () => {
        console.log('end of request')
        session.close();
    })
})
// Get current Dream
app.get('/api/Dream/:id', ensureToken, function (req, res) {

    console.log('Request id = ', req.params.id)
    const resultPromise = session.run(`MATCH (p:POST)
                            WHERE ID(p) = ${req.params.id} 
                            RETURN p;`)
    resultPromise.then(data => {
        let r = data.records.map(item => {
            return {dream:item.get(0)['properties'], dream_id:item.get(0)['identity']['low'] } 
        })
        // console.log('Dream to return', r)
        res.send(r);   
    })
    .catch( err => {
        console.log('error in request', err)
        res.send(err)
    })
    .finally(() => {
        // console.log('finally');
        session.close()       
    })
});

app.get('/api/suggestion/:dream_id', ensureToken, function(req, res){
    // :id - id dream in db
    // const id_dream = req.params.dream_id
    // let dreamText; // for future scope
    // const resultPromise = session.run(`MATCH (p:POST) WHERE ID(p) = ${id_dream} RETURN p`)
    // //With dream data make suggestion
    // resultPromise.then(data => {
    //     let r = data.records.map(item => {
    //         return {dream:item.get(0)['properties']}
    //     })
    //     console.log('result', r)
    //     console.log('result', r[0]['dream']['text'])
    //     dreamText = r[0]['dream']['text']
    //     const _DREAM = new DreamObject(dreamText)
    //     const actions = _DREAM.getActions()
    //     console.log('actions', actions)
    //     const place = _DREAM.getPlaces()
    //     console.log('place', place)
    //     if(place.length > 0 && actions.length > 0){
    //         // const objects = _DREAM.getActions() NOT READY
    //         const suggestionPromise = session.run(`MATCH (c:Company)
    //                                                 WHERE c.actions CONTAINS '${actions}' AND c.place CONTAINS '${place}'
    //                                                 RETURN c`)
    //         suggestionPromise.then(data => {
    //             let suggestion = data.records.map(item => {
    //                 return {company:item.get(0)['properties']}
    //             })
    //             console.log('suggestions', suggestion)
    //             res.send({response:{dreamText, suggestion}})
    //         })
    //     }
    //     else 
    //     res.send({response:{suggestion:{}}})
    // })
    res.send({response:{suggestion:{}}})
})

app.get('/api/Members/:id_post', function (req, res) {

    let prom = session.run(`MATCH (p:POST)<-[:MEMBER]-(m:User)
                            WHERE ID(p) = ${req.params.id_post}
                            RETURN m;`).then(data => {
        session.close()       
        // driver.close();
        let r = data.records.map(item => item.get(0)['properties'])
        res.send(r);   
               // data.records.map( (item, i) => {
        //      a.push(item.get(0))
        //     })
    })
    .catch( err => {
        res.send(err)
    })
});

app.get('/api/Setup', function (req, res) {

    let prom = session.run('MATCH (s:Setup) RETURN s').then(data => {
        session.close()       
        // driver.close();
        console.log('Somebody want my setup');
        let r = data.records.map(item => item.get(0)['properties'])
        res.send(r);   
               // data.records.map( (item, i) => {
        //      a.push(item.get(0))
        //     })
    })
});

// friend_id  <- const name for friends middlware
app.get('/api/Dreams/:friend_id', ensureToken, isFriend, function (req, res) {
    let friend_id;
    if(req.params.friend_id == 'me'){
        friend_id = res.locals.userID
    } else {
        friend_id = req.params.friend_id
    }
    console.log('User = ', res.locals.userID)
    console.log('Request user = ', friend_id)
    // res.send({dreams:[{dream:1, header:'Тест', context:'Post1'}, {dream:2, header:'Подорож', context:'Поїхати в Карпати'}] });
    const resultPromise = session.run(`MATCH (u:User)-[:OWNER]->(p:POST)
                            WHERE ID(u) = ${friend_id} 
                            RETURN p;`)
    resultPromise.then(data => {
        let r = data.records.map(item => {
            return {dream:item.get(0)['properties'], dream_id:item.get(0)['identity']['low'] } 
        })
        // console.log(r)
        res.send(r);   
    })
    .catch( err => {
        console.log('error in request', err)
        res.send(err)
    })
    .finally(() => {
        console.log('finally');
        session.close()       
    })
});

app.post('/api/Dream', jsonParser, ensureToken,  function(req, res){
    if (!req.body) return res.sendStatus(400)
    let dream = req.body
    let user = res.locals.userID
    console.log('USER', user)
    console.log('New dream is comming ..', dream)
    session.run(`MATCH (a:User)
                 WHERE ID(a) = ${user}
                 CREATE (a)-[r:OWNER]->(b:POST {text:'${dream.dream}', time:${Date.now()}})
                 RETURN b`).then(data => {
                    session.close()  
                    let r = data.records.map( item =>{
                        return {dream:item.get(0)['properties'], dream_id:item.get(0)['identity']['low'] }
                    })
        console.log(`Dream with ID ${r[0]} was created`);     
        res.send(r)
    })  
})

app.delete('/api/Dream/:id', ensureToken, function (req, res) {

    const resultPromise = session.run(`MATCH (p:POST)
                            WHERE ID(p) = ${req.params.id} 
                            DETACH DELETE p
                            RETURN p;`)
    resultPromise.then(data => {
        let r = data.records.map(item => item.get(0)['properties'])
        console.log(`Dream ${req.params.id} removed...`)
        res.send(r);   
    })
    .catch( err => {
        console.log('error in request', err)
        res.send(err)
    })
    .finally(() => {
        console.log('finally delete is over');
        session.close()       
    })
});
// 

app.get('*', function(req, res){
    res.sendFile(__dirname+'/public/index.html');
    // app.use(express.static(__dirname + '/public'))
})

server.listen(process.env.PORT || 8080, function () {
  console.log('Example app listening on port 80!');
});

// exports.app = functions.https.onRequest(app);


// const Nexmo = require('nexmo');
// const nexmo = new Nexmo({ 
//   apiKey: 'a35874e2',
//   apiSecret: 'JSP91dFOCSeJgtyT'
// }) 

// app.post('/sms', function(req, res){
// const from = 'Dreamster'
//     const to = '380974196416'
//     const text = 'Welcome to Dreamster'
//     nexmo.message.sendSms(from, to,  text)
//     res.send('Sended');
// })
/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxfSwiaWF0IjoxNTQwMzA3NzgzfQ.lWG6cD7iyA-emJAVLCYwm7MViOFXPlTIZx9SzvvKffA
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJuYW1lIjoiQW5kcmV3In0sImlhdCI6MTU0MDMwNzk4Mn0.BCkjmT9eXFFdT8RVAUrTCDtmcZ8U3aDPmvw_ppU8bYU"*/