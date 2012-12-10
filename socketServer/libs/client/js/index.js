/**
 * 客户端入口文件
 * 1、获取服务器端在页面中植入的会话数据
 * 2、引入测试用例依赖的库
 * 3、初始化与server的连接并负责之后的通信
 * 4、执行测试用例
 * 5、讲结果返回给server
 */
;(function(){

    var NAMESPACE = '__WIND_TEST_CONFIG';
    var Config = window[ NAMESPACE ];

    (function wrap( code ){
        eval( code );
    })( Config.code );

})();