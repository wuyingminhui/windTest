/**
 *
 */
var _ = require( 'underscore' );
var Test = require( '../test' );

var Routes = {

    NEW_TEST: function( testData, next ){
        Test.create( testData, next );
    },

    TEST_FINISH: function( info, next ){
        Test.finish( info.sessionId, next );
    },

    TEST_ERROR: function(){

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