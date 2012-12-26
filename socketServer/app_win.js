/**
 * Module dependencies.
 * windows下开启所有依赖的js
 * @date 2012-12-17 19:50:03
 * @主要依赖有 redis、selenium
 */


var path = require('path');


var CONFIG = {
    "CHROME_DRIVER_PATH": "../Selenium/chromedriver",
    "SELENIUM_SERVER_JAR_PATH": "../Selenium/selenium-server-standalone-2.24.1.jar",
    "REDIS_SERVER_PATH": "../Redis/windows/redis-server.exe"
};
/**
 * 执行操作系统命令
 * @param {String} command
 * @param {Function} callback
 */
function exec(command, callback) {
    var spawn = require('child_process').spawn;

    var cmd = spawn("cmd", command);

    cmd.stdout.setEncoding("ASCII");
    cmd.stdout.on("data", function (data) {
        console.log("stdout:" + data);
        callback && callback({type:'INFO', data:data.toString()}, cmd );
    });

    cmd.stderr.on("data", function (data) {
        console.log("stderr:" + data);
        callback && callback({type:'ERROR', data:data.toString()}, cmd );
    });

    cmd.on("exit", function (code) {
        console.log("exited with code:" + code);
        callback && callback({type:'END', data:code.toString()}, cmd );
    });
}
function startSelenium(successFun){
// Selenium server jar 位置
    var Selenium_Server = path.resolve( __dirname, CONFIG.SELENIUM_SERVER_JAR_PATH );
// Chrome dirver 位置
    var ChromeDriver = path.resolve( __dirname, CONFIG.CHROME_DRIVER_PATH );
// 检查是否为windows
    if( process.platform.indexOf( 'win' ) == 0 ){
        ChromeDriver += '.exe';
    }
    // 用于启动selenium server的命令
    var SeleniumSetupCommand = [
        '/c',
        'java',
        '-jar',
        Selenium_Server,
        '-Dwebdriver.chrome.driver=' + ChromeDriver
    ];
    exec( SeleniumSetupCommand, function ( result) {
        //启动后每一行都是一个data，通过检查data来查看是否成功启动了server
        if ( result.data.indexOf( 'Started SocketListener on' ) != -1
            || result.data.indexOf( 'Selenium is already running on port' ) != -1) {
            successFun && successFun();
        }
        if(result.type == 'ERROR' && result.data.indexOf( 'java' ) != -1){
            var errorMsg = 'Do Not Find java, plaese install java runtime!';
//            console.error( errorMsg );
        }
    });
}
function startRedis(successFun){
    var REDIS_Server = path.resolve( __dirname, CONFIG.REDIS_SERVER_PATH );
    console.log(REDIS_Server);
    var setupCommand = [
        '/c',
        REDIS_Server
    ];
    exec( setupCommand, function ( result) {
        //启动后每一行都是一个data，通过检查data来查看是否成功启动了server
        if ( result.data.indexOf( 'The server is now ready to accept connections' )) {
            successFun && successFun();
        }
        if(result.type == 'ERROR'){
            console.error( result );
        }
    });
}
function openURL(url){
    var setupCommand = [
        '/c',
        'start',
        url
    ];
    exec( setupCommand, function ( result) {
        if(result.type == 'ERROR'){
            console.error( result );
        }
    });
}
function startSocket(){
    var express = require('express')
        , routes = require('./routes')
        , user = require('./routes/user')
        , http = require('http')
        , path = require('path')
        , socketIo = require('socket.io');

    var Socket = require( './libs/socket/socket' );

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
    app.get('/doc', routes.doc);

// Express 3.x 的app将不再是一个httpServer instance，
// 因此需要返回server 然后手动给定socketIo
    var server = http.createServer(app).listen(app.get('port'), function(){
        console.log("Express server listening on port " + app.get('port'));
        //打开浏览器
        openURL("http://127.0.0.1:3000/");
    });

// 绑定socket.io
    var io = socketIo.listen( server );

    io.sockets.on('connection', function (socket) {
        Socket.handle( socket );
    });

}



//启动服务
startSelenium(function(){
    startRedis(function(){
        startSocket();
    });
});