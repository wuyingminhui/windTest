/**
 * 对于webdriverNode的控制
 */

var WD = require( 'webdriverNode' );

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

    _newWinId: function(){
        return ++WIN_ID;
    },

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

    _runTest: function( client, url, caseCode, next ){
        client.protocol.url( url );
        client.executeAsync( function( code ){
            eval( code )
        }, [ caseCode ], function(){
            next();
        })
    },

    /**
     * 创建新的测试
     * @param obj
     * @param next
     */
    newTest: function( obj, next ){

        var sessionId = obj.sessionId;
        var url = obj.url;
        var caseCode = obj.code;
        var browserName = obj.browserName;
        var client = SessionClientList[ sessionId ];
        var winId = this._newWinId();
        var self = this;

        if( client ){
            self._runTest( client, url, caseCode, function(){
                next( sessionId, winId );
            });
        }
        else {

            this._newSession({ browserName: browserName }, function( client, sessionId ){
                SessionClientList[ sessionId ] = client;
                self._runTest( client, url, caseCode, function(){
                    next( sessionId, winId );
                });
            });
        }
    },

    finishSession: function( sessionId, next ){
        var client = SessionClientList[ sessionId ];
        if( client ){
            client.end(next);
        }
        else {
            next();
        }
    }


};