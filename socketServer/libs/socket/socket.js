/**
 * Socket 接口
 */

var _ = require( 'underscore' );
var Test = require( '../test/test' );

/**
 * 用于保存当某个测试用例（当个window）结束时需要执行的回调（返回给client）
 * TestFinishCallback[ sessionId ][ windId ]
 */

var TestFinishCallback = {};

/**
 * 用于保存当某个测试用例（所有相关window）结束时需要执行的回调（返回给client）
 * AllTestFinishCallback[ sessionId ]
 */
var AllTestFinishCallback = {};

var Routes = {

    /**
     * 新测试到来
     * @param testData
     * @param next
     */

    NEW_TEST: function( testData, next ){
        Test.newTest( testData, function( err, obj ){
            // 讲新建的窗口Id返回给父窗口
            next( obj );
        });
    },

    /**
     * 一次测试的结束
     * @param info.sessionId
     * @param info.parentId
     * @param info.winId
     * @param info.testResult
     * @param info.globalData
     */

    TEST_FINISH: function( info ){

        Test.finish( info, function( ret ){

            var sessionId = ret.sessionId;
            var callback;

            // 检查是否所有测试都结束了，否则通知其父页面
            if( !ret.ifAllFinish ){
                // 通知parent window
                var winId = ret.winId;

                if( TestFinishCallback[ sessionId ] ){
                    callback = TestFinishCallback[ sessionId ][ winId ];
                    if( typeof callback == 'function' ){
                        callback( ret );
                        delete TestFinishCallback[ sessionId ][ winId ];
                    }
                }
            }

            // 若所有测试完毕
            else {

                callback = AllTestFinishCallback[ sessionId ];
                if( typeof callback == 'function' ){
                    callback( ret.allResult );
                }
            }
        });
    },

    /**
     * @name WaitAllTestCallback
     * @function
     * @param {Array} allResult
     * @param {String} allResult[].winId 窗口id
     * @param {String} allResult[].testResult 该窗口的测试结果
     */

    /**
     * 请求监听整个测试的结束
     * @param {Object} testInfo
     * @param {String} testInfo.sessionId 会话Id
     * @param {WaitAllTestCallback} next
     */

    WAIT_ALL_TEST: function( testInfo, next ){
        // 获取相关信息
        AllTestFinishCallback[ testInfo.sessionId ] = next;
    },

    /**
     * @name WaitTestCallback
     * @function
     * @param {Object} info
     * @param {String} info.sessionId
     * @param {String} info.winId
     * @param {Boolean} info.ifAllFinish 是否整个测试用例都完成了
     * @param {Object} info.winResult 本win的测试结果
     * @param next
     */

    /**
     * 请求监听某个测试窗口，当其完成时，讲执行next
     * @param {Object} info
     * @param {String} info.sessionId
     * @param {String} info.winId
     * @param {WaitTestCallback} next
     */

    WAIT_TEST: function( info, next ){

        // 获取相关信息
        var sessionId = info.sessionId;
        var winId = info.winId;
        if( !TestFinishCallback[ sessionId ] ){
            TestFinishCallback[ sessionId ] = {};
        }

        TestFinishCallback[ sessionId ][ winId ] = next;
    },

    /**
     * @name GlobalDataCallback
     * @function
     * @param {Object} result
     * @param {Boolean} result.success 是否成功
     * @param {Object} result.error 错误消息对象
     * @param {Object} result.data 全局数据
     */

    /**
     * 获取/设置全局数据
     * @param {Object} reqData
     * @param {String} reqData.type 类型: set|get
     * @param {Object} reqData.data 需要设置的数据
     * @param {Object} reqData.sessionId
     * @param {GlobalDataCallback} next
     */

    GLOBAL_DATA: function( reqData, next ){

        var type = reqData.type;
        var data = reqData.data;
        var sessionId = reqData.sessionId;

        if( type == 'get' ){
            Test.getGlobalData( sessionId, function( err, data ){
                next({
                    success: err === null,
                    error: err,
                    data: data
                });
            });
        }
        else if( type == 'set' ){
            Test.setGlobalData( sessionId, data, function( err, data ){
                next({
                    success: err === null,
                    error: err,
                    data: data
                });
            });
        }
        else {
            next( {
                success: false
            });
        }
    },

    /**
     * 一次测试出现错误:
     */

    TEST_ERROR: function( err ){

    }
};

module.exports = {

    handle: function( socket ){

        // 监听
        _.each( Routes, function( fn, type ){
            socket.on( type, fn );
        });
    }
};