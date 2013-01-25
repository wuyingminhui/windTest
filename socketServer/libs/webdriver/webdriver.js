/**
 * 对于webdriverNode的控制
 */

var WD = require( 'webdriverNode' );
var TestSession = require( '../redis/session' );
var ClientCodeWrap = require( './clientCodeWrap' );
var Compress = require( './compress' );
var GetIP = require( 'getip' );
var ClientManager = require( './clientManager' );

/**
 * 用于储存运行中的Client
 * @type {{}}
 */
var SessionClientList = {};

module.exports = {

    /**
     * 获取sessionId对应的client
     * @param {Object} clientInfo 需要获取的client信息
     * @param {String} [clientInfo.sessionId] 如果已经存在会话，则制定该会话的sessionId
     * @param {String} [clientInfo.browserName] 如果是创建一个新的client，则需要制定需要测试的浏览器
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Client} next.client
     * @param {String} next.sessionId
     */

    getClient: function( clientInfo, next ){

        var client;

        if( typeof clientInfo.sessionId == 'undefined' ){

            // 若没有给定sessionId，则应该为新创建一个
            this._newSession( { browserName: clientInfo.browserName }, function( c, sId ){

                // 储存Client
                // 从session中获取session数据，重新实例化Client
                new TestSession( sId, function( err, S ){
                    S.setClientData( WD.toJSON( c ), function( err ){
                        if( err ){
                            next( err );
                        }
                        else {

                            // 向内存中储存client
                            SessionClientList[ sId ] = c;
                            next( null, c, sId );
                        }
                    });
                });
            });
        }
        else {

            var sessionId = clientInfo.sessionId;

            // 先从内存中查找client
            client = SessionClientList[ sessionId ];
            if( client ){
                return next( null, client, sessionId );
            }

            /**
             * 如果给定了sessionId 但是内存只能怪没有，那么有可能是在会话进行中，server挂了（于是内存里的数据就丢失了）
             * 因此我们从数据库中找找
             */

            else {
                // 从session中获取session数据，重新实例化Client
                new TestSession( sessionId, function( err, S ){
                    if( err ){
                        next( err );
                    }
                    else {
                        // 获取client数据
                        S.clientData(function( err, clientObj ){


                            if( err ){
                                next( err );
                            }
                            else if( clientObj ){
                                client = WD.instantiate( clientObj );
                                next( null, client, sessionId );
                            }
                            else {
                                throw new Error( 'can\' find Client Data with: sessionId: ' + sessionId );
                            }
                        });
                    }
                });
            }
        }
    },

    /**
     * 创建一个新的会话
     * @param {Object} info 测试相关的信息
     * @param {String} info.browserName 浏览器名称
     * @param {String} [info.version] 浏览器版本
     * @param {Function} next callback
     * @param {Client} next.client 创建的client实例对象
     * @param {String} next.sessionId 新创建的会话Id
     * @private
     */

    _newSession: function(info, next){
        var clientHost = ClientManager.getClientHost( info.browserName, info.version );
        var client = WD.remote({
            desiredCapabilities: {
                browserName: info.browserName
            },
            host: clientHost || undefined
        });

        client.init(function( ret ){
            var sessionId = ret.value;
            next( client, sessionId, clientHost );
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

        // 对用户的测试用例做非ASCII 转化为 Unicode 处理
        if( obj.code ){
            obj.code = Compress( obj.code );
        }

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
                // 获取本地ip
                GetIP.getNetworkIPs(function( err, ips ){
                    obj.ip = ips[0];
                    client.executeAsync( ClientCodeWrap, [ obj ], function(){
                        next( ret.value );
                    });
                })
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
     * @param {Object} obj
     * @param {String} obj.url
     * @param {String} obj.browserName
     * @param {String} obj.sessionId
     * @param {String} obj.winId
     * @param {String} obj.code
     * @param {String[]} obj.libs
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {String} next.sessionId
     * @param {String} next.winId
     */

    newTest: function( obj, next ){

        var url = obj.url;
        var self = this;
        var testInfo = {
            sessionId: obj.sessionId,
            parentId: obj.winId,
            code: obj.code,
            libs: obj.libs
        };

        this.getClient({ sessionId: obj.sessionId, browserName: obj.browserName }, function( err, client, sId ){

            if( err ){
                next( err );
            }
            else {
                testInfo.sessionId = sId;
                self._runTest( client, url, testInfo, function( winId ){
                    next( null, sId, winId );
                });
            }
        });
    },

    /**
     * 结束一个会话（end）
     * @param sessionId
     * @param {Function} next
     * @param {Object=null} next.err
     */
    finishSession: function( sessionId, next ){

        this.getClient({ sessionId: sessionId }, function( err, client, sId ){

            if( err ){
                next( err );
            }
            else {
                if( client ){
                    client.end(function(){
                        next( null );
                    });

                    // 释放
                    delete SessionClientList[ sessionId ];

                    // 获取client的host，释放host的计数
                    ClientManager.releaseClient( client.toJSON().host );
                }
                else {
                    next( null );
                }
            }
        });
    },

    /**
     * 关闭窗口
     * @param {String} sessionId
     * @param {String} winId
     * @param {Function} next
     * @param {Object=null} next.err
     */
    closeWindow: function( sessionId, winId, next ){

        this.getClient({ sessionId: sessionId }, function( err, client, sId ){
            if( err ){
                next( err );
            }
            else {
                if( client ){
                    client.closeWindow( winId, function(){
                        next( null );
                    });
                }
                else {
                    next( null );
                }
            }
        });
    }
};