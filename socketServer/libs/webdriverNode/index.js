/**
 * 对于webdriverNode的控制
 */

var WD = require( 'webdriverNode' );
var ClientCodeWrap = require( './clientCodeWrap' );

/**
 * 用于储存运行中的Client
 * @type {{}}
 */
var SessionClientList = {};

/**
 * winId
 * @type {number}
 */

var WIN_ID = 0;

module.exports = {

    /**
     * 创建一个新的页面Id
     * @return {number}
     * @private
     */

    _newWinId: function(){
        return ++WIN_ID;
    },

    /**
     * 创建一个新的会话
     * @param {Object} info 测试相关的信息
     * @param next
     * @private
     */

    _newSession: function(info, next){

        var client = WD.remote({
            desiredCapabilities: {
                browserName: info.browserName
            }
        });

        client.init(function( ret ){
            var sessionId = ret.value;
            next( client, sessionId );
        });
    },

    /**
     * 执行一段测试用例
     * @param client 已经初始化过的client
     * @param url 页面地址
     * @param obj 测试信息
     * @param next
     * @private
     */

    _runTest: function( client, url, obj, next ){

        /**
         * 通过parentId是否存在来检查是否为第一次，如果为第一次，使用URL，否则新建窗口
         */
        if( obj.parentId ){

            /**
             * 先激活到parentwindow，否则如果刚刚已经关闭过窗口，当前激活句柄还是在那个已经关闭的句柄上，会出错
             */

            client.protocol.window( obj.parentId );

            client.openWindow( url, function( ret ){
                obj.winId = ret.value;
                client.executeAsync( ClientCodeWrap, [ obj ], function(){
                    next( ret.value );
                });
            });
        }
        else {

            client.url( url, function(){
                // 获取默认页面的句柄
                client.protocol.windowHandle(function( ret ){
                    obj.winId = ret.value;
                    // 执行脚本
                    client.executeAsync( ClientCodeWrap, [ obj ], function(){
                        next( ret.value );
                    });
                });
            });
        }
    },

    /**
     * 创建新的测试
     * @param obj
     * @param next
     */

    newTest: function( obj, next ){

        var url = obj.url;
        var browserName = obj.browserName;
        var client = SessionClientList[ obj.sessionId ];
        var self = this;
        var testInfo = {
            sessionId: obj.sessionId,
            parentId: obj.winId,
            code: obj.code,
            globalData: obj.globalData,
            libs: obj.libs
        };

        // 如果已经存在会话

        if( client ){
            self._runTest( client, url, testInfo, function( winId ){
                next( testInfo.sessionId, winId );
            });
        }
        else {

            this._newSession({ browserName: browserName }, function( client, sessionId ){
                SessionClientList[ sessionId ] = client;
                testInfo.sessionId = sessionId;
                self._runTest( client, url, testInfo, function( winId ){
                    next( testInfo.sessionId, winId );
                });
            });
        }
    },

    /**
     * 结束一个会话（end）
     * @param sessionId
     * @param next
     */
    finishSession: function( sessionId, next ){
        var client = SessionClientList[ sessionId ];
        if( client ){
            client.end(next);

            // 释放
            delete SessionClientList[ sessionId ];
        }
        else {
            next();
        }
    },

    closeWindow: function( sessionId, winId, next ){
        var client = SessionClientList[ sessionId ];
        if( client ){
            client.closeWindow( winId, next );
        }
        else {
            next();
        }
    }
};