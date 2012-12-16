;(function(){
    var Socket = io.connect();
    var Config;

    $(document).ready(function(){

        var NAMESPACE = '__WIND_TEST_CONFIG';
        var timer = setInterval(function(){
            Config = window[ NAMESPACE ];
            if( Config ){
                clearInterval( timer );
                init( Config );
            }
        }, 100 );
    });

    function init( config ){

        // 渲染测试信息
        renderTestInfo( config );

        // 注册事件
        attach();
    }

    function attach(){

        // 绑定测试结束事件
        $( '.J_FinishTestTrigger').bind( 'click', function( e ){
            e.preventDefault();
            finishTest();
        });

        $( '.J_NewTestTrigger').bind( 'click', function( e ){
            e.preventDefault();
            newTest(function(){
                alert( 'fiinished!' );
            });
        });
    }

    function finishTest(){
        Socket.emit( 'TEST_FINISH', {
            sessionId: Config.sessionId,
            winId: Config.winId,
            testResult: $.parseJSON( $( '.J_TestResult').val())
        });
    }

    function newTest( next ){
        Socket.emit( 'NEW_TEST', {
            sessionId: Config.sessionId,
            winId: Config.winId,
            url: document.location.href,
            browserName: 'chrome',
            code: 'alert("hello");'
        }, next );
    }

    function renderTestInfo( config ){
        var key;
        var value;
        var HTML = '';
        for( key in config ){
            value = config[ key ];
            HTML +=  '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
        }

        console.log( HTML );

        debugger;
        $( '.J_TestInfoTable tbody').append( HTML );
    }

})();