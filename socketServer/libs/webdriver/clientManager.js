/**
 * 用于调度测试机器
 */

var CONFIG = require( './client.json' );

/**
 * 在内存中保存测试机器的连接数
 * @type {Object}
 *      { host: count }
 */
var hostConnectCount = {};

module.exports = {

    /**
     * 根据需要测试的浏览器和版本号来获取何时的host
     * @param browserName
     * @param version
     * @return {String|null}
     */

    getClientHost: function( browserName, version ){

        var availableList = CONFIG[ browserName ];
        var targetHost = null;

        if( availableList ){
            if( version ){
                availableList = availableList[ version ];
            }

            if( availableList && availableList.length > 0 ){
                targetHost = this.getMinConnectClient( availableList );
                this.retainClient( targetHost );
            }
        }

        return targetHost;
    },

    /**
     * 从host列表中获取连接数最小的host
     * @param hostList
     * @return {String}
     */

    getMinConnectClient: function( hostList ){

        var min;
        var count;
        var target;

        hostList.forEach(function( host ){
            count = hostConnectCount[ host ];
            if( min === undefined || count < min ){
                min = count;
                target = host;
            }
        });

        return target;
    },

    /**
     * 将制定host的连接数减一
     * @param host
     */

    releaseClient: function( host ){
        if( host ){
            var count = hostConnectCount[ host ];
            if( !count ){
                count = 0;
            }
            else {
                count--;
            }
            hostConnectCount[ host ] = count;
        }
    },

    /**
     * 将制定host的连接数加一
     * @param host
     */

    retainClient: function( host ){
        if( host ){
            var count = hostConnectCount[ host ];
            if( !count ){
                count = 0;
            }

            count++;
            hostConnectCount[ host ] = count;
        }
    }
};

