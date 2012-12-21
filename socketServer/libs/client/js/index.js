/**
 * 客户端接口API库
 * 用于实现测试用例中的open、run
 */
debugger;
alert(123);
(function (win) {
    _loadScript('http://localhost:3000/js/libs/SyncRun/EventEmitter.js', function () {
        _loadScript('http://localhost:3000/js/libs/SyncRun/SyncRun.js', function () {
            _loadScript('http://localhost:3000/js/libs/socket.io/socket.io.js', function () {
                var UT = win.UT = {};
debugger;
                var Socket = io.connect('http://localhost:3000');
                var Config;

                //初始化SyncRun
                var SyncMethod = SyncRun.newQueue();
                var Do = SyncMethod(function ( next ){
                    next();
                });

                /**
                 * 获取全局的测试数据
                 * 由于Selenium会在页面onLoad时才植入代码，因此这里不一定马上能得到
                 * todo 检查配置信息丢失异常
                 */
                var NAMESPACE = '__WIND_TEST_CONFIG';
                Config = window[ NAMESPACE ];

                UT.open = function (url, exeFunc, cb) {
                    Do(function(){
                        newTest(url, exeFunc, function(ret){
                            waitTestFinish(ret.winId, _finished);
                        });
                    });
                };

                //todo
                UT._finish = function(data){
                    finishTest(data);
                };

                /**
                 *
                 * @param ret
                 * @private
                 * @todo
                 */
                function _finished(ret){
                    //收到结束通知
                    alert(ret);
                }

                /**
                 * 启动一个新测试
                 * @param url
                 * @param exeFunc
                 * @param {Function} next `{winId: 'winId'}`
                 * todo 浏览器类型
                 */
                function newTest(url, exeFunc, next) {
                    Socket.emit('NEW_TEST', {
                        sessionId: Config.sessionId,
                        winId: Config.winId,
                        url: url,
                        browserName: 'chrome',
                        code: ';(' +exeFunc.toString() + ')();'
                    }, next);
                }

                /**
                 * 向服务器请求，当制定的winId的测试完成，通过回调通知
                 * @param winId
                 * @param next
                 */

                function waitTestFinish(winId, next) {
                    Socket.emit('WAIT_TEST', {
                        sessionId: Config.sessionId,
                        winId: winId
                    }, next);
                }

                /**
                 * 告诉服务器，当前测试已经完成
                 * 该操作将关闭当前页面，并通知父页面
                 */

                function finishTest(data) {
                    Socket.emit('TEST_FINISH', {
                        sessionId: Config.sessionId,
                        winId: Config.winId,
                        testResult: data
                    });
                }


                function getGlobalData(next) {
                    Socket.emit('GLOBAL_DATA', { type: 'get', sessionId: Config.sessionId }, function (ret) {
                        if (ret.success) {
                            next(ret.data);
                        }
                        else {
                            alert(JSON.stringify(ret.error) || '获取数据失败');
                            next();
                        }
                    });
                }

                function setGlobalData(obj, next) {
                    Socket.emit('GLOBAL_DATA', { type: 'set', data: obj, sessionId: Config.sessionId }, function (ret) {
                        if (ret.success) {
                            next(ret.data);
                        }
                        else {
                            alert(JSON.stringify(ret.error) || '设置数据失败');
                            next();
                        }
                    });
                }

                /**
                 * 客户端入口文件
                 * 1、获取服务器端在页面中植入的会话数据
                 * 2、引入测试用例依赖的库
                 * 3、初始化与server的连接并负责之后的通信
                 * 4、执行测试用例
                 * 5、讲结果返回给server
                 */
                (function () {

                    var NAMESPACE = '__WIND_TEST_CONFIG';
                    var Config = window[ NAMESPACE ];
debugger
                    (function wrap(code) {
                        eval(code);
                    })(Config.code);

                })();
            });

        });
    });

    function _loadScript(url, callback) {
        var script = document.createElement('script');
        if (callback) script.onload = callback;
        script.type = 'text/javascript';
        script.async = true;
        script.src = url;
        document.head.appendChild(script);
    }

})(window);
