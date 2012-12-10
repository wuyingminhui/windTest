/**
 *
 */
var _ = require( 'underscore' );
var Test = require( '../test' );

var Routes = {

    /**
     * 新测试到来
     * @param testData
     * @param next
     */

    NEW_TEST: function( testData, next ){
        Test.newTest( testData, next );
    },

    /**
     * 一次测试的结束
     * @param info
     * @param next
     */

    TEST_FINISH: function( info, next ){
        Test.finish( info, next);
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