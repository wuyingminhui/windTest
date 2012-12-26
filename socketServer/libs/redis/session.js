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
 * 设置Key的超时
 * @param key
 * @param timeout
 * @param {Function} next
 * @param {Object=null} next.err
 */

function SetExpire( key, timeout, next ){
    Client.expire( key, timeout, next );
}

/**
 * 用于设置session数据的Class
 * @param id
 * @param {Function} next
 * @param {Object=null} next.err
 * @param {Session} next.S
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
 * @return {String}
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
 * 检查sessionId是否已经存在
 * @param {String} id 会话id
 * @param {Function} next
 * @param {Object=null} next.err
 * @param {Boolean} next.ifExist
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
     * 初始化，设置GlobalData为空对象
     * @param id
     * @param ifExist
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Session} next.S
     * @private
     */

    _init: function( id, ifExist, next ){
        this.sessionId = id;
        this.sessionKey = Session.sessionId( id );
        this.globalDataKey = this.sessionKey + ':globalData';
        this.clientDataKey = this.sessionKey + ':client';
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
     * 获取全局数据
     * @param {Function} next
     * @param {Object=null} next.err
     * @param {Object} next.ret 全局数据对象
     */

    globalData: function( next ){
        Client.get( this.globalDataKey, function( err, ret ){
            next( err, JSON.parse( ret ) );
        });
    },

    /**
     * 设置全局数据
     * @param data
     * @param {Function} next
     * @param {Object=null} next.err
     */

    setGlobalData: function( data, next ){
        Client.set( this.globalDataKey, JSON.stringify( data ), next );
        // 设置超时
        this.setExpire();
    },

    /**
     * 获取client实例数据
     * @param {Function} next callback
     * @param {Object} next.clientObj
     */

    clientData: function( next ){
        Client.get( this.clientDataKey, function( err, ret ){
            next( err, JSON.parse( ret ) );
        });
    },

    /**
     * 设置client实例数据
     * @param {Object} clientData
     * @param {Function} next
     * @param {Object=null} next.err
     */

    setClientData: function( clientData, next ){
        Client.set( this.clientDataKey, JSON.stringify( clientData ), next );
        // 设置超时
        this.setExpire();
    },

    /**
     * 获取指定窗口执行过程中产生的页面错误
     * @param {String} winId
     * @param {Function} next calxlback
     * @param {Object=null} next.err
     * @param {Object[]} next.errors
     */

    errors: function( winId, next ){
        this.getWin( winId, function( err, winObj ){

            if( err ){
                next( err );
            }
            else {
                var errors;
                if( winObj ){
                    errors = JSON.parse( winObj.errors );
                }
                next( null, errors );
            }
        });
    },

    /**
     * 为指定页面添加一条错误记录
     * @param {String} winId
     * @param {Object} errorInfo
     * @param {Function} next callback
     * @param {Object=null} next.err
     */

    addError: function( winId, errorInfo, next ){
        var self = this;

        this.getWin( winId, function( err, winObj ){
            if( err ){
                next( err );
            }
            else {

                if( !winObj ){
                    winObj = {};
                }

                if( !winObj.errors ){
                    winObj.errors = [];
                }

                winObj.errors.push( errorInfo );
                self.setWin( winId, winObj, next );
                // 设置超时
                self.setExpire();
            }
        });
    },

    /**
     * 添加一个测试win
     * @param id
     * @param {Object} winObj 测试window信息
     * @param {Function} next
     * @param {Object=null} next.err
     */

    addWin: function( id, winObj, next ){
        winObj.winId = id;
        this.setWin( id, winObj, next );
    },

    /**
     * 获取win数据
     * @param {String} id window Id
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object} next.winObj
     * @param {String} next.winObj.winId 窗口Id
     * @param {String} [next.winObj.parentId] 父窗口id, 如果为父窗口，则该值为空
     * @param {String} next.winObj.stat 当前执行状态
     * @param {Object} [next.winObj.testResult] 测试结果
     */

    getWin: function( id, next ){
        var winKey = Session.winId( this.sessionId, id );
        Client.hgetall( winKey, next );
    },

    /**
     * 设置win数据
     * @param id
     * @param {Object} winObj 需要设置的window信息
     * @param {Function} next callback
     * @param {Object=null} next.err
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
     * 获取所有的win对象id数组，以数组返回
     * @param {Function} next
     * @param {Object=null} next.err
     * @param {String[]} next.idList 窗口id列表
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
     * 获取winId列表
     * @param {Function} next
     * @param {Object=null} next.err
     * @param {String[]} next.winList 窗口列表
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
     * 删除win
     * @param {String} winId
     * @param {Function} next
     * @param {Object=null} next.err
     */

    removeWin: function( winId, next ){
        var winKey = Session.winId( this.sessionId, winId );
        Client.del( winKey, next );
        // 设置超时
        this.setExpire();
    },

    /**
     * 销毁session数据
     * @param {Function} next
     * @param {Object=null} next.err
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

        Client.keys( '*', function( err, keys ){
            keys.splice( 0, 0, self.sessionKey );
            Client.del.apply( Client, keys );
        });
    },

    /**
     * 更新数据的expire倒计时.
     * @param {Function} [next]
     * @param {Object=null} [next.err]
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