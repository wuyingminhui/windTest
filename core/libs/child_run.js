/**
 * 运行单个浏览器的测试用例的子进程
 * @author neekey<ni184775761@gmail.com>
 * @date 2012.11.29
 */
var SingleBrowserRunner = require( './single_browser_runner' );

var Argvs = process.argv;
// 用户脚本解析的代码数据
var UserScriptChunks = JSON.parse( Argvs[ 0 ] );
// 需要测试的浏览器
var BROWSER_NAME = Argvs[1];
// 依赖的库
var JS_LIBS = JSON.parse( Argvs[ 2 ] )

// 实例话一个测试用例 Runner
var SBR = new SingleBrowserRunner( UserScriptChunks, BROWSER_NAME, JS_LIBS );
// 执行测试用例
SBR.run(function( result ){

    // 执行完毕后向父进程发送消息
    process.send( {
        type: 'end',
        data: {
            testResult: result
        }
    });
});