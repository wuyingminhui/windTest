var socket = io.connect();

$(document).ready(function(){

    var IORes = $( '.J_Response' );

    var TESTURL = $( '.J_TestURL' );
    var TESTBrowser = $( '.J_TestBrowser' );
    var TESTCode = $( '.J_TestCode' );
    var TestTrigger = $( '.J_TestRun' );

    // 启动新测试
    TestTrigger.bind( 'click', function( event ){

        event.preventDefault();
        var testObj = {
            url: TESTURL.val(),
            browserName: TESTBrowser.val(),
            code: TESTCode.val()
        };

        // 发送一个新测试请求
        socket.emit( 'NEW_TEST', testObj, function( testInfo ){
            // 订阅所有测试完成事件
            socket.emit( 'WAIT_ALL_TEST', testInfo, function( testResult ){

                console.log( 'TEST FINISH: ', testResult );
                var index
                    , value
                    , winId
                    , result
                    , HTML = '';

                for( index = 0; value = testResult[ index]; index++ ){
                    winId = value[ 'winId' ];
                    result = value[ 'testResult' ];

                    HTML += '<tr><td>' + winId + '</td><td>' + result + '</td></tr>';
                }

                // 清空当前的数据
                $( '.J_TestResultTable tbody').append( HTML );
            });
        });
    });
});