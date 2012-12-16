/**
 *
 */
var _ = require( 'underscore' );
var Test = require( '../test' );

var TestCallBack = {};

var Routes = {

    /**
     * 新测试到来
     * @param testData
     * @param next
     */

    NEW_TEST: function( testData, next ){
        console.log( 'NEW TEST: ', testData );
        Test.newTest( testData, function( obj ){
            var sessionId = obj.sessionId;
            var winId = obj.winId;

            if( !TestCallBack[ sessionId ] ){
                TestCallBack[ sessionId ] = {};
            }

            TestCallBack[ sessionId ][ winId ] = next;
        });
    },

    /**
     * 一次测试的结束
     * @param info
     * @param next
     */

    TEST_FINISH: function( info, next ){
        Test.finish( info, function( ret ){
            console.log( 'TEST FINISHED!!!!!!!', ret );
            if( !ret.ifAllFinish ){
                // 通知parent window
                var sessionId = info.sessionId;
                var winId = info.winId;
                var callback;

                if( TestCallBack[ sessionId ] ){
                    callback = TestCallBack[ sessionId ][ winId ];
                    if( typeof callback == 'function' ){
                        callback( info );
                        delete TestCallBack[ sessionId ][ winId ];
                    }
                }
            }
        });
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