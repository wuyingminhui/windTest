#!/usr/bin/env node

/**
 * 启动Redis/Selenium/Socket-server
 * `node run.mac.js --debug`
 * `--debug` 可选，指定后讲输出所有log
 *
 */

var Path = require( 'path' );
var ChildProcess = require( 'child_process');
var PS = require( 'ps-node' );
var StartWeb = require( './utils/start_web' );
var Color = require( './utils/color').color;
var Platform = process.platform;
var Args = process.argv.splice( 1 );

var IF_WIN = ( Platform == 'win32' );

// 是否启动了DEGUB模式
var DEBUG_MOD = Args.join( ' ' ).indexOf( '--debug' ) >= 0;
// 是否只需要启动Selenium
var SELENIUM_ONLY = Args.join( ' ' ).indexOf( '--selenium' ) >= 0;

var CONFIG = {
    // Chrome driver
    'CHROME_DRIVER_PATH': Path.resolve( __dirname, './Selenium/chromedriver' ) + ( IF_WIN ? '.exe' : '' ),
    // Selenium
    'SELENIUM_SERVER_JAR_PATH': Path.resolve( __dirname, './Selenium/selenium-server-standalone-2.24.1.jar' ),
    // Redis
    'REDIS_SERVER_PATH': ( IF_WIN ? Path.resolve( __dirname, './Redis/windows/redis-server.exe' ) : Path.resolve( __dirname, './Redis/mac_linux/src/redis-server' ) ),
    // Socket Server
    'SOCKET_SERVER_PATH': Path.resolve( __dirname, './socketServer/app.js' )
};

var RedisExec;
var SeleniumExec;
var SocketExec;

if( SELENIUM_ONLY ){
    StartSelenium();
}
else {
    StartRedis(function(){
        StartSelenium(function(){
            StartServer();
        });
    });
}

function checkAllKilled(){
    if( !RedisExec && !SeleniumExec && !SocketExec ){
        setTimeout(function(){
            console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'All services are killed!' );
            process.exit(1);
        }, 2000 );
    }
}

function StartSelenium( next ){

    // 先检查Selenium是否已经启动过了
    PS.lookup( { command: '.*java.*', arguments: '.*selenium.*' }, function( err, resultList ){

        if( resultList && resultList.length > 0 ){
            SeleniumExec = resultList[ 0 ].pid;
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Selenium Server is already running.' );
            next && next();
        }
        else {
            var SeleniumSetupCommand = [
                'java',
                '-jar',
                CONFIG.SELENIUM_SERVER_JAR_PATH,
                '-Dwebdriver.chrome.driver=' + CONFIG.CHROME_DRIVER_PATH
            ];

            var exec = ChildProcess.exec( SeleniumSetupCommand.join( ' ' ) );

            exec.stdout.on( 'data', function (data) {
                DEBUG_MOD && console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data);

                if( data.indexOf( 'tarted org.openqa.jetty.jetty.Server' ) >= 0 ){
                    console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Selenium Server has been started successfully.' );
                    next && next();
                }
            });

            exec.stderr.on('error', function (data) {
                console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
                next && next();
            });

            exec.on('exit', function (code) {
                console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Selenium server has exit with code: ', code );
                SeleniumExec = null;
                checkAllKilled();
            });

            SeleniumExec = exec;
        }
    });
}

function StartRedis( next ){

    // 先检查Redis是否已经启动过了

    PS.lookup( { command: '.*redis-server.*' }, function( err, resultList ){
        if( resultList && resultList.length > 0 ){

            RedisExec = resultList[ 0 ].pid;
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Redis Server is already running.' );
            next && next();
        }
        else {
            var setupCommand = [
                CONFIG.REDIS_SERVER_PATH
            ];
            var exec = ChildProcess.exec( setupCommand.join( ' ' ) );

            exec.stdout.on( 'data', function (data) {

                DEBUG_MOD && console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data);

                if( data.indexOf( 'The server is now ready to accept connections on port' ) >= 0 ){
                    console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Redis server has been started successfully.' );
                    next && next();
                }
            });

            exec.stderr.on('error', function (data) {
                console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
                next && next();
            });

            exec.on('exit', function (code) {
                console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Redis server has exit with code: ', code );
                RedisExec = null;
                checkAllKilled();
            });

            RedisExec = exec;
        }
    });
}

function StartServer( next ){

    // 先检查Selenium是否已经启动过了
    PS.lookup( { command: 'node', arguments: 'socketServer/app.js' }, function( err, resultList ){

        if( resultList && resultList.length > 0 ){
            SocketExec = resultList[ 0 ].pid;
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Socket Server is already running.' );
            next && next();
        }
        else {
            var exec = ChildProcess.exec( 'node ' + CONFIG.SOCKET_SERVER_PATH );

            exec.stdout.on( 'data', function (data) {
                DEBUG_MOD && console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data);

                if( data.indexOf( 'Express server listening on port' ) >= 0 ){
                    console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Socket server has been started successfully. Opening... ' );
                    console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data );
                    var port = /Express\sserver\slistening\son\sport\s(\d+)/.exec( data )[1];
                    StartWeb( 'http://localhost:' + port + '/' );
                    next && next();
                }
            });

            exec.stderr.on('error', function (data) {
                console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
                next && next();
            });

            exec.on('exit', function (code) {
                console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Socket server has exit with code: ', code );
                SocketExec = null;
                checkAllKilled();
            });

            SocketExec = exec;
        }
    });
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on( 'data', function (chunk) {

    if( chunk.trim() == 'close' ){

        console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Stop servers ...' );

        var redisPid = typeof RedisExec == 'string' ? RedisExec : RedisExec ? RedisExec.pid : undefined;

        redisPid && PS.kill( redisPid, function( err ){
            RedisExec = null;
            if( err ){
                console.log('[' + Color( 'ERROR', 'light_red' ) + ']', 'Killing Redis Server failed: ', err );
            }
            else {
                console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Redis server has been killed.' );
            }
            checkAllKilled();
        });

        var seleniumPid = typeof SeleniumExec == 'string' ? SeleniumExec : SeleniumExec ? SeleniumExec.pid : undefined;

        seleniumPid && setTimeout(function(){
            PS.kill( seleniumPid, function( err ){
                SeleniumExec = null;
                if( err ){
                    console.log('[' + Color( 'ERROR', 'light_red' ) + ']', 'Killing Selenium Server failed: ', err );
                }
                else {
                    console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Selenium server has been killed.' );
                }
                checkAllKilled();
            });
        }, 500);

        var socketPid = typeof SocketExec == 'string' ? SocketExec : SocketExec ? SocketExec.pid : undefined;
        socketPid && setTimeout(function(){
            PS.kill( socketPid, function( err ){
                SocketExec = null;
                if( err ){
                    console.log('[' + Color( 'ERROR', 'light_red' ) + ']', 'Killing Socket Server failed: ', err );
                }
                else {
                    console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Socket server has been killed.' );
                }
                checkAllKilled();
            });
        }, 2000 );
    }
});
