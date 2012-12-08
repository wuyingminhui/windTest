var socket = io.connect();

$(document).ready(function(){

    var IOType = $( '.J_Type' );
    var IOMsg = $( '.J_Msg' );
    var IORes = $( '.J_Response' );
    var IOTrigger = $( '.J_Trigger' );

    var TESTURL = $( '.J_TestURL' );
    var TESTBrowser = $( '.J_TestBrowser' );
    var TESTCode = $( '.J_TestCode' );
    var TestTrigger = $( '.J_TestRun' );

    IOTrigger.bind( 'click', function(){
        var type = IOType.val();
        var msg = IOMsg.val();

        if( type && msg ){
            socket.emit( type, JSON.parse( msg ), function( data ){
                IORes.html( JSON.stringify( data ) );
            });
        }
    });

    TestTrigger.bind( 'click', function(){
        var testObj = {
            url: TESTURL.val(),
            browser: TESTBrowser.val(),
            code: TESTCode.val()
        };

        socket.emit( 'NEW_TEST', testObj, function( data ){
            IORes.html( JSON.stringify( data ) );
        });

    });
});