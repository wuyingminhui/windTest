/**
 * 客户端接口API库
 * 用于实现测试用例中的open、run
 */
(function (win) {

    /**
     * 载入依赖的脚本
     */
    _loadScript('http://localhost:3000/js/libs/Do.js', function () {
        _loadScript('http://localhost:3000/js/libs/socket.io/socket.io.js', function () {

            var Socket = io.connect('http://localhost:3000');
            var UT = win.UT = {};
            var Config;

            /**
             * 同步队列方法
             * @param {Function} fn 需要执行的方法
             * @example
             * ```
             *      var queue = [];
             *
             *      Do(function( done ){
             *          setTimeout(function(){
             *              queue.push( 'a' );
             *              done();
             *          }, 5000 );
             *      });
             *
             *      Do(function( done ){
             *          queue.push( 'b' );
             *          done();
             *      });
             *
             *      Do(function( done ){
             *          console.log( queue.join( '' ) == 'ab' ) // => true
             *          done();
             *      });
             *
             * ```
             */
            var Do = window.Do;

            /**
             * 获取全局的测试数据
             * todo 检查配置信息丢失异常
             */
            var NAMESPACE = '__WIND_TEST_CONFIG';
            Config = window[ NAMESPACE ];

            /**
             * 开新窗口执行测试
             * @param {String} url 需要测试的页面地址
             * @param {Function} exeFunc 测试用例的函数
             */
            UT.open = function (url, exeFunc ){

                Do(function( done ){

                    // 创建新测试
                    newTest(url, exeFunc, function(ret){

                        // 新测试请求后向服务器请求，当该测试完成时执行回调
                        waitTestFinish(ret.winId, function(){
                            done();
                        });
                    });
                });
            };

            /**
             * 完成当前页面的测试
             * @param {Object} result 需要返回给server的测试用例
             */
            UT.done = function( result ){
                Do(function(){
                    finishTest( result );
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
                (function wrap(code) {
                    eval(code);
                })(Config.code);

            })();
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
