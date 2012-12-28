#!/usr/bin/env node

/**
 * 启动Redis/Selenium/Socket-server
 * `node run.mac.js --debug`
 * `--debug` 可选，指定后讲输出所有log
 *
 */
    
var Path = require( 'path' );
var ChildProcess = require( 'child_process');
var StartWeb = require( './utils/start_web' );
var Color = require( './utils/color').color;
var Args = process.argv.splice( 1 );

// 是否启动了DEGUB模式
var DEBUG_MOD = Args.join( ' ' ).indexOf( '--debug' ) >= 0;

var CONFIG = {
    // Chrome driver
    'CHROME_DRIVER_PATH': Path.resolve( __dirname, './Selenium/chromedriver' ),
    // Selenium
    'SELENIUM_SERVER_JAR_PATH': Path.resolve( __dirname, './Selenium/selenium-server-standalone-2.24.1.jar' ),
    // Redis
    'REDIS_SERVER_PATH': Path.resolve( __dirname, './Redis/mac_linux/src/redis-server' ),
    // Socket Server
    'SOCKET_SERVER_PATH': Path.resolve( __dirname, './socketServer/app.js' )
};

var RedisExec = StartRedis();
var SeleniumExec = StartSelenium();
var SocketExec = StartServer();

function checkAllKilled(){
    if( !RedisExec && !SeleniumExec && !SocketExec ){
        process.exit(1);
    }
}

function StartSelenium( successFun ){

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
        }
    });

    exec.stderr.on('error', function (data) {
        console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
    });

    exec.on('exit', function (code) {
        console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Selenium server has exit with code: ', code );
        SeleniumExec = null;
        checkAllKilled();
    });

    return exec;
}

function StartRedis(){

    var setupCommand = [
        CONFIG.REDIS_SERVER_PATH
    ];

    var exec = ChildProcess.exec( setupCommand.join( ' ' ) );

    exec.stdout.on( 'data', function (data) {

        DEBUG_MOD && console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data);

        if( data.indexOf( 'The server is now ready to accept connections on port' ) >= 0 ){
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Redis server has been started successfully.' );
        }
    });

    exec.stderr.on('error', function (data) {
        console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
    });

    exec.on('exit', function (code) {
        console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Redis server has exit with code: ', code );
        RedisExec = null;
        checkAllKilled();
    });

    return exec;
}

function StartServer(){

    var exec = ChildProcess.exec( 'node ' + CONFIG.SOCKET_SERVER_PATH );

    exec.stdout.on( 'data', function (data) {
        DEBUG_MOD && console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data);

        if( data.indexOf( 'Express server listening on port' ) >= 0 ){
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Socket server has been started successfully. Opening... ' );
            console.log( '[' + Color( 'INFO', 'light_green' ) + ']', data );
            var port = /Express\sserver\slistening\son\sport\s(\d+)/.exec( data )[1];
            StartWeb( 'http://localhost:' + port + '/' );
        }
    });

    exec.stderr.on('error', function (data) {
        console.log('[' + Color( 'ERROR', 'light_red' ) + ']', data);
    });

    exec.on('exit', function (code) {
        console.log( '[' + Color( 'EXIT', 'light_yellow' ) + ']', 'Socket server has exit with code: ', code );
        SocketExec = null;
        checkAllKilled();
    });

    return exec;
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on( 'data', function (chunk) {
    if( chunk.substring( 0, chunk.length - 1 ) == 'close' ){

        console.log( '[' + Color( 'INFO', 'light_green' ) + ']', 'Stop servers ...' );
        RedisExec.kill();
        SeleniumExec.kill();
        SocketExec.kill();
    }
});
