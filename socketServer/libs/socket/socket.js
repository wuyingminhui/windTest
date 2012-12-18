/**
 *
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

                console.log( 'ALL TEST FINISHED! ', ret );
                console.log( 'ALL TEST CALLBACK! ', AllTestFinishCallback[ sessionId ] );

                callback = AllTestFinishCallback[ sessionId ];
                if( typeof callback == 'function' ){
                    callback( ret.allResult );
                }
            }
        });
    },

    WAIT_ALL_TEST: function( testInfo, next ){
        console.log( 'WAIT ALL TEST: ', testInfo );
        // 获取相关信息
        var sessionId = testInfo.sessionId;
        AllTestFinishCallback[ sessionId ] = next;
    },

    /**
     * 请求监听某个测试窗口，当其完成时，讲执行next
     * @param info
     * @param next
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

    GLOBAL_DATA: function( reqData, next ){

        var type = reqData.type;
        var data = reqData.data;
        var sessionId = reqData.sessionId;

        if( type == 'get' ){
            Test.getGlobalData( sessionId, function( err, data ){
                next( {
                    success: err === null,
                    error: err,
                    data: data
                });
            });
        }
        else if( type == 'set' ){
            Test.setGlobalData( sessionId, data, function( err, data ){
                next( {
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