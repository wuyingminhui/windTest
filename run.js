#!/usr/bin/env node

var Platform = process.platform;
var ChildProcess = require( 'child_process');
var Path = require( 'path' );

// 如果为windows
if( Platform === 'win32' ){
    ChildProcess.fork( Path.resolve( __dirname, './run.mac.js' ), process.argv );
}
// 其他系统
else {
    ChildProcess.fork( Path.resolve( __dirname, './run.mac.js' ), process.argv );
}