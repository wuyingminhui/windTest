/**
 * 客户端接口API库
 * 用于实现测试用例中的open、run
 */
(function () {

    var WIN = this;

    /**
     * 载入依赖的脚本
     */
    _loadScript([
        'http://localhost:3000/js/libs/Do.js',
        'http://localhost:3000/js/libs/socket.io/socket.io.js',
        'http://localhost:3000/js/libs/traceKit.js',
        'http://localhost:3000/js/UITest.js'
    ], function () {

        if( 'undefined' === typeof UT ){
            new Error( 'UITest 加载失败!' );
        }
        else {

            UT.init( io, Do, TraceKit );
        }
    });

    /**
     * 加载脚本
     * @param {String|String[]} url
     * @param callback
     * @private
     */

    function _loadScript(url, callback) {

        if( typeof url == 'string' ){
            url = [ url ];
        }

        var scriptLen = url.length;
        var scriptCount = 0;
        var script;
        var index;
        var onLoadCallback = function(){
            if( ++scriptCount == scriptLen ){
                callback();
            }
        };

        for( index = 0; url[ index ]; index++ ){

            script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = onLoadCallback;
            script.src = url[ index ];
            document.head.appendChild(script);
        }
    }

})();
