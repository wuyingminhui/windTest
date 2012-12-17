/**
 * 模拟测试用例的Client行为
 */

;(function(){

    var Socket = io.connect();
    var Config;

    $(document).ready(function(){

        /**
         * 获取全局的测试数据
         * 由于Selenium会在页面onLoad时才植入代码，因此这里不一定马上能得到
         */

        var NAMESPACE = '__WIND_TEST_CONFIG';
        var timer = setInterval(function(){
            Config = window[ NAMESPACE ];
            if( Config ){
                clearInterval( timer );
                init( Config );
            }
        }, 100 );
    });

    /**
     * 初始化方法
     * @param {Object} config 全局测试数据
     */

    function init( config ){

        // 渲染测试信息
        renderTestInfo( config );

        // 注册事件
        attach();
    }

    /**
     * 注册事件
     */

    function attach(){

        /**
         * 绑定测试结束事件
         */

        $( '.J_FinishTestTrigger').bind( 'click', function( e ){
            e.preventDefault();
            finishTest();
        });

        /**
         * 开启一个新的子测试，当新的测试启动后，再发送一个对新测试完成的通知请求
         */

        $( '.J_NewTestTrigger').bind( 'click', function( e ){
            e.preventDefault();

            // 发送新测试请求
            newTest(function( result ){

                alert( JSON.stringify( result ) );

                // 请求当自测试结束后，通知client
                waitTestFinish( result.winId, function( result ){

                    alert( 'FINISHED' );
                });
            });
        });
    }

    /**
     * 启动一个新测试
     * @param {Function} next `{winId: 'winId'}`
     */

    function newTest( next ){
        Socket.emit( 'NEW_TEST', {
            sessionId: Config.sessionId,
            winId: Config.winId,
            url: document.location.href,
            browserName: 'chrome',
            code: 'alert("hello");'
        }, next );
    }

    /**
     * 向服务器请求，当制定的winId的测试完成，通过回调通知
     * @param winId
     * @param next
     */

    function waitTestFinish( winId, next ){
        Socket.emit( 'WAIT_TEST', {
            sessionId: Config.sessionId,
            winId: winId
        }, next );
    }

    /**
     * 告诉服务器，当前测试已经完成
     * 该操作将关闭当前页面，并通知父页面
     */

    function finishTest(){
        Socket.emit( 'TEST_FINISH', {
            sessionId: Config.sessionId,
            winId: Config.winId,
            testResult: $.parseJSON( $( '.J_TestResult').val())
        });
    }

    /**
     * 讲当前页面的测试数据渲染到页面中
     * @param config
     */
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