/*

passport login sample

*/

const http = require('http');
const fsm = require('fs');
const express = require('express');
const path = require('path');
const passport = require('passport');
const passportLocal = require('passport-local');
const bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');

let users = require('./users.js');

(async ()=>{

const LocalStrategy = passportLocal.Strategy;
const fs = fsm.promises;

let webServer;
let socketServer;
let app;

app = express();
app.use(session({
  secret: 'test app',
  resave: true,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session()); 

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new LocalStrategy(
  (username, password, done)=>{
    if(!users[username]){
      return done(null, false);
    }
    if(users[username].pass != password){
      return done(null, false);
    }
    return done(null, username);
  }
));

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'www'));
app.engine('html', ejs.renderFile);

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('Auth ok');
    return next();
  }
  console.warn("not authenticated.");
  res.redirect('/');
}

app.post('/login', 
  passport.authenticate('local',{failureRedirect: '/',session: true}),
  (req, res) => {
    console.log('login ok: '+req.user);
    res.redirect('/'+req.user);
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  console.log('logout ok');
  res.redirect('/');
});

app.get('/register', (req, res) => res.render('register.html'));

app.post('/newuser', async (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;
  console.log("user:"+user+" pass:"+pass);

  if(users[user]){
    console.log("["+user+"] already exists!");
    res.redirect('/register');
  }else{
    console.log("add new user");
    users[user] = {"pass":pass};
    let filename = __dirname+"/"+"users.js";
    let str1 = "module.exports = ";
    let str2 = JSON.stringify(users);
    await fs.writeFile(filename, str1+str2);
    res.redirect('/');
  }
});

app.get('/:user', isAuthenticated, (req, res) => res.render('app.html'));

app.use('/', express.static("./www"));

app.use((error, req, res, next) => {
  if(error){
    console.warn('app error,', error.message);
    error.status = error.status || (error.name === 'TypeError' ? 400 : 500);
    res.statusMessage = error.message;
    res.status(error.status).send(String(error));
  }else{
    next();
  }
});

webServer = http.createServer(app);
webServer.on('error', (err) => {
  console.error('starting web server failed:', err.message);
});

const listenIp = "127.0.0.1";
const listenPort  = 3100;

webServer.listen(listenPort, listenIp, () => {
  console.log('server is running');
  console.log(`open https://${listenIp}:${listenPort} in your web browser`);
});

})();

