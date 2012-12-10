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
        client.protocol.url( url );
        client.executeAsync( ClientCodeWrap, [ obj ], function(){
            next();
        });
    },

    /**
     * 创建新的测试
     * @param obj
     * @param next
     */

    newTest: function( obj, next ){

        var sessionId = obj.sessionId;
        var url = obj.url;
        var browserName = obj.browserName;
        var client = SessionClientList[ sessionId ];
        var winId = this._newWinId();
        var self = this;

        // 如果已经存在会话

        if( client ){
            self._runTest( client, url, obj, function(){
                next( sessionId, winId );
            });
        }
        else {

            this._newSession({ browserName: browserName }, function( client, sessionId ){
                SessionClientList[ sessionId ] = client;
                self._runTest( client, url, obj, function(){
                    next( sessionId, winId );
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
    }


};