var FS = require('fs');
var path = require('path');
var ServerSetup = require( './server_setup' );
var ScriptRunner = require( './script_runner' );

var args = process.argv.splice(2);
var targetFile = args[0];
var userScript = FS.readFileSync(targetFile, 'utf-8');

ServerSetup.init(function( err, child_process ){

    if( err ){
        console.log( err.msg );
    }
    else {
        // 执行我们滴脚本
        var runner = new ScriptRunner({
            userScript: userScript,
            targetBrowsers: [ 'chrome', 'firefox' ],
            libs: [
                __dirname + '/../script/libs/jasmine-min.js',
                __dirname + '/../script/libs/jasmine-jsreporter-min.js'
            ]
        });

        runner.on( 'allBrowserFinished', function( data ){
            console.log( 'success!!!', data );
        });

        runner.run();
    }
});
