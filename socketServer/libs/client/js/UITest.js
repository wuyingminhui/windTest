/**
 * UITest Client Library.
 */

;(function(){

    var WIN = this;

    if( WIN.UT ){
        WIN._UT = WIN.UT;
    }

    /**
     * 发送给Server的消息类型, 枚举
     * @type {Object}
     */

    var MSG_TYPE = {

        // 新测试
        NEW_TEST: 'NEW_TEST',
        // 等待测试结束
        WAIT_TEST: 'WAIT_TEST',
        // 当前测试结束
        TEST_FINISH: 'TEST_FINISH',
        // 全局数据
        GLOBAL_DATA: 'GLOBAL_DATA',
        // 测试出错
        TEST_ERROR: 'TEST_ERROR'
    };

    /**
     * UITest 测试框架
     */

    var UT = {

        /**
         * 测试信息在window下的key
         */

        _TEST_INFO_NAMESPACE: '__WIND_TEST_CONFIG',

        /**
         * 与当前测试以及当前窗口相关的测试信息
         * @private
         */

        _testInfo: {},

        /**
         * socket.io
         * @private
         */

        _IO: undefined,

        /**
         * Socket.io 实例对象
         * @private
         */

        _Socket: undefined,

        /**
         * 同步队列
         */

        _Do: undefined,

        /**
         * 初始化
         * @param IO
         * @param Do
         * @param TraceKit
         */

        init: function( IO, Do, TraceKit ){

            var self = this;

            if( !IO ){
                new Error( '无法找到Socket.io.js, 请先载入!' );
            }

            if( !Do ){
                new Error( '无法找到Do.js, 请先载入!' );
            }

            if( !TraceKit ){
                new Error( '无法找到TraceKit.js, 请先载入!' );
            }

            /**
             * 生成一个新的队列，避免其他人对默认队列进行操作
             */

            this._Do = Do.newQueue();
            this._IO = IO;
            this._TraceKit = TraceKit;

            this._getTestInfo(function( Config ){
                self._testInfo = Config;
                self._socketInit();
                self._traceKitInit();
                self._runTest( Config.code );
            });
        },

        /**
         * 开新窗口执行测试
         * @param {String} url 需要测试的页面地址
         * @param {Function} exeFunc 测试用例的函数
         */

        open: function( url, exeFunc ){

            var self = this;
            this._Do(function( done ){

                // 创建新测试
                self._newTest( url, exeFunc, function( ret ){

                    if( ret.success ){

                        // 新测试请求后向服务器请求
                        self._waitTestFinish( ret.data.winId, function(){
                            alert( 'child over!' );
                            done();
                        });
                    }
                    else {

                        done();

                        if( ret.err ){
                            new Error( ret.err );
                        }
                        else {
                            new Error( '创建新测试失败!' );
                        }
                    }
                });
            });
        },

        done: function( result ){

            var self = this;

            this._Do(function( done ){
                alert( 'done!' );
                self._finishTest( result );
                done();
            });
        },

        /**
         * 获取全局数据
         * @param next
         */

        get: function( next ){

            this._getGlobalData( next );
        },

        /**
         * 设置全局数据
         */

        set: function( key, value, next ){

            var dataObj;

            if( typeof key === 'object' && typeof value === 'function' ){
                dataObj = key;
                next = value;
            }
            else {
                dataObj = {
                    key: value
                };
            }

            this._setGlobalData( dataObj, next );
        },

        /**
         * 获取页面中的测试信息
         * @param next
         * @private
         */

        _getTestInfo: function( next ){

            var NAMESPACE = this._TEST_INFO_NAMESPACE;
            var Config = window[ NAMESPACE ];

            if( !Config ){
                var timer = setInterval(function(){
                    Config = window[ NAMESPACE ];
                    if( Config ){
                        clearInterval( timer );
                        next( Config );
                    }
                }, 100 );
            }
            else {
                next( Config );
            }
        },

        /**
         * 初始化socket.io连接
         * @private
         */

        _socketInit: function(){

            var server = this._testInfo.server;
            this._Socket = io.connect( server || 'localhost' );

        },

        /**
         * 监控页面中的脚本错误信息
         * @private
         */

        _traceKitInit: function(){

            var self = this;
            // 监控页面错误，发送给Server
            this._TraceKit.report.subscribe(function(stackInfo){

                // 先输出到控制台
                log( 'type: ', stackInfo.mode, ' msg: ', stackInfo.message );

                var stack = stackInfo.stack;
                var line;
                var index;

                if (!stack || stack.length === 0) return;

                if (stack[0].context){
                    log(indent(stack[0].context.join('\n')));
                }

                for ( index = 0; index < stack.length; index++){
                    line = stack[ index ];
                    log('    at ' + line.func + ' (' + [line.url, line.line, line.column].join(':') + ')');
                }

                // 传送到server
                self._reportTestError( stackInfo );
            });

            function log(){
                if( console && console.log ){
                    console.log.apply( console, arguments );
                }
            }
        },

        /**
         * 执行测试用例
         * @param {String} code
         * @private
         */

        _runTest: function( code ){
            eval.call( WIN, code );
        },

        /**
         * 和Socket.io进行通信
         * @param msgType 消息类型
         * @param [data] 附带的数据
         * @param next 回调
         * @private
         */

        _request: function( msgType, data, next ){
            if( 'function' === typeof data ){
                next = data;
                data = {};
            }

            this._Socket.emit( msgType, this._requestDataWrap( data ), next );
        },

        /**
         * 对发送的数据进行封装，添加基本信息（sessionId，winId等）
         * @param data
         * @return {Object}
         * @private
         */

        _requestDataWrap: function( data ){
            data.sessionId = this._testInfo.sessionId;
            data.winId = this._testInfo.winId;
            data.parentId = this._testInfo.parentId;
            data.browser = this._testInfo.browser;
            return data;
        },

        /**
         * 在新窗口中启动一个测试
         * @param {String} url
         * @param {Function} exeFunc 测试代码
         * @param {Function} next
         * @param {Boolean} next.success 操作是否成功
         * @param {Object} [next.err]
         * @param {Object} [next.data]
         * @param {Object} next.data.sessionId
         * @param {Object} next.data.winId
         * @private
         */

        _newTest: function(url, exeFunc, next) {

            var data = {
                url: url,
                code: this._testCodeWrap( exeFunc )
            };

            this._request( MSG_TYPE.NEW_TEST, data, next);
        },

        /**
         * 对用户的测试代码进行封装
         * @param {Function} exeFunc 测试用例函数
         * @return {string}
         * @private
         */

        _testCodeWrap: function( exeFunc ){
            return ';(' +exeFunc.toString() + ')();';
        },

        /**
         * 请求当指定的窗口完成测试时，得到通知
         * @param winId 需要订阅的窗口id
         * @param {Function} next callback
         * @param {Boolean} next.success
         * @param {Object} next.data
         * @param next.data.sessionId
         * @param next.data.winId
         * @param next.data.winResult
         * @param next.data.ifAllFinish
         * @param next.data.allResult
         * @private
         */

        _waitTestFinish: function(winId, next) {
            this._request( MSG_TYPE.WAIT_TEST, { targetWinId: winId }, next);
        },

        /**
         * 通知Server，当前窗口测试完毕
         * @param data 当前窗口的测试结果
         * @private
         */

        _finishTest: function( data ) {
            this._request( MSG_TYPE.TEST_FINISH, { testResult: data });
        },

        /**
         * 获取当前的全局数据
         * @param {Function} next callback
         * @param {Object} next.data GlobalData
         * @private
         */

        _getGlobalData: function( next ) {
            this._request( MSG_TYPE.GLOBAL_DATA, { type: 'get' }, function (ret) {
                if ( ret.success ) {
                    next && next( ret.data );
                }
                else {
                    alert( JSON.stringify(ret.err) || '获取全局数据出错!' );
                    next && next();
                }
            });
        },

        /**
         * 设置全局数据
         * @param obj
         * @param {Function} next 回调
         * @param {Object} next.data GlobalData
         * @private
         */

        _setGlobalData: function(obj, next) {
            this._request( MSG_TYPE.GLOBAL_DATA, { type: 'set', data: obj }, function ( ret ) {
                if ( ret.success ) {
                    next && next( ret.data );
                }
                else {
                    alert( JSON.stringify( ret.err ) || '设置全局数据失败!' );
                    next && next();
                }
            });
        },

        /**
         * 向server报告当前页面的错误
         * @param {Object} errData
         * @param {function} [next]
         */

        _reportTestError: function( errData, next ){
            this._request( MSG_TYPE.TEST_ERROR, { errorInfo: errData }, function ( ret ) {
                if ( ret.success ) {
                    alert( 'server receive!' );
                }
                else {
                    alert( JSON.stringify( ret.err ) || '提交脚本错误失败!' );
                    next && next();
                }
            });
        }
    };

    // 添加到host中
    WIN.UT = UT;

})();