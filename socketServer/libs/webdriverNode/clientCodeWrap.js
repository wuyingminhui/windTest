/**
 * 服务器端向浏览器端植入的代码
 * 1、将相关数据写入到全局
 * 2、引入client的入口文件，之后的逻辑都交给client.
 * @param args
 * @param done
 */

module.exports = function( args, done ){

    // 命名空间

    var NAMESPACE = '__WIND_TEST_CONFIG';

    // 种子文件入口

    var clientSeedURL = 'http://localhost:3000/js/index.js?t=' + (new Date).valueOf();

    // 将会话数据写入

    window[ NAMESPACE ] = {

        // 用于测试用例代码

        code: args.code,

        // 会话sessionId

        sessionId: args.sessionId,

        // 当前窗口Id

        winId: args.winId,

        // 父页面Id

        parentId: args.parentId,

        // 全局数据

        globalData: args.globalData,

        // 测试用例依赖的库

        libs: args.libs

    };

    // 引入入口文件

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = clientSeedURL;
    document.head.appendChild( script );

    // 执行完毕

    done();
};