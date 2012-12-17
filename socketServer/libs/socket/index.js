/**
 *
 */
var _ = require( 'underscore' );
var Test = require( '../test' );

/**
 * 用于保存当摸个测试用例结束时需要执行的回调（返回给client）
 * TestFinishCallback[ sessionId ][ windId ]
 */

var TestFinishCallback = {};

var Routes = {

    /**
     * 新测试到来
     * @param testData
     * @param next
     */

    NEW_TEST: function( testData, next ){
        console.log( 'NEW TEST: ', testData );
        Test.newTest( testData, function( obj ){
            var winId = obj.winId;

            // 讲新建的窗口Id返回给父窗口
            next({ winId: winId } );
        });
    },

    /**
     * 一次测试的结束
     * @param info
     */

    TEST_FINISH: function( info ){

        Test.finish( info, function( ret ){

            // 检查是否所有测试都结束了，否则通知其父页面
            if( !ret.ifAllFinish ){
                // 通知parent window
                var sessionId = info.sessionId;
                var winId = info.winId;
                var callback;

                if( TestFinishCallback[ sessionId ] ){
                    callback = TestFinishCallback[ sessionId ][ winId ];
                    if( typeof callback == 'function' ){
                        callback( info );
                        delete TestFinishCallback[ sessionId ][ winId ];
                    }
                }
            }
        });
    },

    /**
     * 请求监听某个测试窗口，当其完成时，讲执行next
     * @param info
     * @param next
     */

    WAIT_TEST: function( info, next ){

        // 获取相关信息
        console.log( 'WAIT_TEST!!!', info );
        var sessionId = info.sessionId;
        var winId = info.winId;
        if( !TestFinishCallback[ sessionId ] ){
            TestFinishCallback[ sessionId ] = {};
        }

        TestFinishCallback[ sessionId ][ winId ] = next;
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