/**
 * 测试的Session数据存储
 */

var _ = require( 'underscore' );
var Redis = require( 'redis' );
var Client = Redis.createClient();

var Config = require( './config.json' );
var S_PREFIX = Config[ 'SESSION_PREFIX' ];
var W_PREFIX = Config[ 'WIN_PREFIX' ];

/**
 * Session数据的超时，默认10分钟如果没有对session进行操作，则自动销毁
 * @type {number}
 */

var SESSION_TIMEOUT = 10 * 60;

function ObjectToArray( name, obj ){

    var fieldArray = [];
    var key;

    for( key in obj ){
        fieldArray.push( key );

        /**
         * 若发现是一个Object对象，则将其序列化为字符串储存
         */

        if(_.isObject( obj[ key ] )){
            fieldArray.push( JSON.stringify( obj[ key ] ) );
        }
        else {
            fieldArray.push( obj[ key ] );
        }
    }

    fieldArray.splice( 0, 0, name );
    return fieldArray;
}

/**
 * @name SetExpireCallback
 * @function
 * @param {Object=null} err
 */

/**
 * 设置Key的超时
 * @param key
 * @param timeout
 * @param {SetExpireCallback} next
 */

function SetExpire( key, timeout, next ){
    Client.expire( key, timeout, next );
}

/**
 * @name SessionCallback
 * @function
 * @param {Object=null} err
 * @param {Session} S
 */

/**
 * 用于设置session数据的Class
 * @param id
 * @param {SessionCallback} next
 */

var Session = function( id, next ){

    var self = this;

    // 先检查sessionId是否已经存在，否则报错
    Session.sessionExist( id, function( err, ifExist ){
        if( err ){
            next( err );
        }
        else {
            self._init( id, ifExist, next );
        }
    });
};

//======== Static Methods ==========

/**
 * 为sessionId补充前缀来构造对应的key
 * @param id
 * @return {String}
 */

Session.sessionId = function( id ){
    return S_PREFIX + id;
};

/**
 * 个顶一个Key提取出其中的sessionId
 * @param {String} key
 * @return {String}
 */

Session.keyToSessionId = function( key ){
    return key.split(':')[ 1 ];
};

/**
 * 为winId补充前缀来构造对应的key
 * @param sessionId
 * @param id
 * @return {*}
 */

Session.winId = function( sessionId, id ){
    return this.sessionId( sessionId ) + ':' + W_PREFIX + id;
};

/**
 * 给定一个Key提取出其中的winId
 * @param {String} key
 * @return {String}
 */

Session.keyToWinId = function( key ){
    return key.split( ':').pop();
};

/**
 * @name SessionExistCallback
 * @function
 * @param {Object=null} err
 * @param {Boolean} ifExist
 */

/**
 * 检查sessionId是否已经存在
 * @param id
 * @param next
 */

Session.sessionExist = function( id, next ){
    Client.keys( this.sessionId( id ) + '*', function( err, ifExist ){
        if( err ){
            next( err );
        }
        else {
            /**
             * ifExist返回的是0或者1
             */

            next( err, !!( ifExist.length ) );
        }
    });
};

//======== Prototype ==========

Session.prototype = {

    /**
     * @name _InitCallback
     * @function
     * @param {Object=null} err
     * @param {Session} S
     */

    /**
     * 初始化，设置GlobalData为空对象
     * @param id
     * @param ifExist
     * @param {_InitCallback} next ( err, session )
     * @private
     */

    _init: function( id, ifExist, next ){
        this.sessionId = id;
        this.sessionKey = Session.sessionId( id );
        this.globalDataKey = this.sessionKey + ':globalData';
        this.expireTimeout = SESSION_TIMEOUT;
        var self = this;

        if( !ifExist ){
            // 设置全局数据
            Client.set( this.globalDataKey, JSON.stringify( {} ), function( err ){

                if( err ){
                    next( err );
                }
                else {
                    // 设置超时
                    self.setExpire(function( err ){
                        next( err, self );
                    });
                }

            });
        }
        else {
            self.setExpire(function( err ){
                next( err, self );
            });
        }
    },

    /**
     * 设置会话的过期时间
     * @param {Number} timeout 单位为秒
     */

    setExpireTimeout: function( timeout ){
        this.expireTimeout = timeout;
    },

    /**
     * @name GlobalDataCallback
     * @function
     * @param {Object=null} err
     * @param {Object} ret 返回的全局对象
     */

    /**
     * 获取全局数据
     * @param {GlobalDataCallback} next
     */

    globalData: function( next ){
        Client.get( this.globalDataKey, function( err, ret ){
            next( err, JSON.parse( ret ) );
        });
    },

    /**
     * @name SetGlobalDataCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 设置全局数据
     * @param data
     * @param {SetGlobalDataCallback} next
     */

    setGlobalData: function( data, next ){
        Client.set( this.globalDataKey, JSON.stringify( data ), next );
        // 设置超时
        this.setExpire();
    },

    /**
     * @name AddWinCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 添加一个测试win
     * @param id
     * @param {Object} winObj 测试window信息
     * @param {AddWinCallback} next
     */

    addWin: function( id, winObj, next ){
        winObj.winId = id;
        this.setWin( id, winObj, next );
    },

    /**
     * 获取win数据
     * @param id
     * @param next
     */

    getWin: function( id, next ){
        var winKey = Session.winId( this.sessionId, id );
        Client.hgetall( winKey, next );
    },

    /**
     * @name SetWinCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 设置win数据
     * @param id
     * @param {Object} winObj 需要设置的window信息
     * @param {SetWinCallback} next
     */

    setWin: function( id, winObj, next ){
        winObj.winId = id;
        var winKey = Session.winId( this.sessionId, id );
        // 将object改造成array的形式
        var winArr = ObjectToArray( winKey, winObj );
        // 讲回调添加到末尾
        winArr.push( next );

        Client.hmset.apply( Client, winArr );
        // 设置超时
        this.setExpire();
    },

    /**
     * @name GetAllWinIdsCallback
     * @function
     * @param {Object=null} err
     * @param {String[]} ids 窗口id数组
     */

    /**
     * 获取所有的win对象id数组，以数组返回
     * @param {GetAllWinIdsCallback} next
     */

    getAllWinIds: function( next ){
        var dumpWinKey = Session.winId( this.sessionId, '*' );
        Client.keys( dumpWinKey, function( err, keys ){
            if( err ){
                next( err );
            }
            else {
                var ids = [];
                keys.forEach(function( key ){
                    ids.push( Number( Session.keyToWinId( key ) ) );
                });
                next( null, ids );
            }
        });
    },

    /**
     * @name GetAllWinCallback
     * @function
     * @param {Object=null} err
     * @param {Object[]} wins 窗口数据数组
     */

    /**
     * 获取winId列表
     * @param {GetAllWinCallback} next
     */

    getAllWins: function( next ){
        var dumpWinKey = Session.winId( this.sessionId, '*' );
        Client.keys( dumpWinKey, function( err, keys ){

            var allWins = [];
            var winLen = keys.length;
            var ifError = false;

            keys.forEach(function( key ){

                if( ifError == false ){
                    Client.hgetall( key, function( err, win ){

                        if( err ){
                            if( ifError === false ){
                                ifError = true;
                                next( err );
                            }
                        }
                        else {
                            allWins.push( win );
                            if( allWins.length == winLen ){
                                next( null, allWins );
                            }
                        }
                    });
                }
            });
        });
    },

    /**
     * @name RemoveWinCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 删除win
     * @param {String} winId
     * @param {RemoveWinCallback} next
     */

    removeWin: function( winId, next ){
        var winKey = Session.winId( this.sessionId, winId );
        Client.del( winKey, next );
        // 设置超时
        this.setExpire();
    },

    /**
     * @name DestroyCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 销毁session数据
     * @param {DestroyCallback} next
     */

    destroy: function(next){
        var self = this;
        Client.keys( this.sessionKey + '*', function( err, keys ){
            if( err ){
                next( err );
            }
            else {
                keys.splice( 0, 0, self.sessionKey );
                keys.push( next );
                Client.del.apply( Client, keys );
            }
        } );
    },

    /**
     * @name SessionSetExpireCallback
     * @function
     * @param {Object=null} err
     */

    /**
     * 更新数据的expire倒计时.
     * @param {SessionSetExpireCallback} [next]
     */
    setExpire: function( next ){
        var self = this;
        Client.keys( this.sessionKey + '*', function( err, keys ){

            if( err ){
                next( err );
            }
            else {
                keys.splice( 0, 0, self.sessionKey );

                var count = 0;
                var ifError = false;

                keys.forEach(function( key ){
                    SetExpire( key, self.expireTimeout, function( err ){

                        // 如果已经出错就不再执行了
                        if( ifError ){
                            return;
                        }

                        if( err ){
                            ifError = true;
                            next( err );
                        }
                        else {
                            count++;
                            if( count >= keys.length ){
                                next && next( null );
                            }
                        }
                    });
                });
            }
        } );
    }
};

module.exports = Session;