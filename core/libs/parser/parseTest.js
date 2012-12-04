/**
 * UglifyJS 解析测试
 */
var FS = require( 'fs' );
var Jsp = require( 'uglify-js' ).parser;
var targetTestFile = './get_task_list.js';
var content = FS.readFileSync( targetTestFile, 'utf-8' );

// parse code and get the initial AST.
var ast = Jsp.parse( content );
console.log( JSON.stringify( ast ) );