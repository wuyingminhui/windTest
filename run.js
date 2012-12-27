#!/usr/bin/env node

var Platform = process.platform;
var ChildProcess = require( 'child_process');
var Path = require( 'path' );

// 如果为windows
if( Platform === 'win32' ){
    ChildProcess.execFile( Path.resolve( __dirname, './socketServer/app_win.js' ) );
}
// 其他系统
else {
    console.log( Path.resolve( __dirname, './run.mac.js' ) );
    ChildProcess.fork( Path.resolve( __dirname, './run.mac.js' ) );
}