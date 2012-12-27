var socket = io.connect();

$(document).ready(function(){

    var TESTURL = $( '.J_TestURL' );
    var TESTBrowser = $( '.J_TestBrowser' );
    var TESTCode = $( '.J_TestCode' );
    var TestTrigger = $( '.J_TestRun' );

    // 初始化ACE
    var editor = ace.edit( TESTCode.get(0) );
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    // 启动新测试
    TestTrigger.bind( 'click', function( event ){

        event.preventDefault();
        var testObj = {
            url: TESTURL.val(),
            browserName: TESTBrowser.val(),
            code: editor.getSession().getValue()
        };

        // 发送一个新测试请求
        socket.emit( 'NEW_TEST', testObj, function( ret ){

            if( ret.success ){
                // 订阅所有测试完成事件
                socket.emit( 'WAIT_ALL_TEST', ret.data, function( ret ){

                    if( ret.success ){
                        var testResult = ret.data;
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
                        $( '.J_TestResultTable tbody').html( HTML );
                    }
                    else {
                        new Error( ret.err );
                    }
                });
            }
            else {
                new Error( ret.err );
            }
        });
    });
});