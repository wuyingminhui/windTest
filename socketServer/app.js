/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , socketIo = require('socket.io');

var Socket = require( './libs/socket' );

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'libs/client')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/simulate', routes.simulate);
app.get('/users', user.list);

// Express 3.x 的app将不再是一个httpServer instance，
// 因此需要返回server 然后手动给定socketIo
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// 绑定socket.io
var io = socketIo.listen( server );

io.sockets.on('connection', function (socket) {
    Socket.handle( socket );
});
