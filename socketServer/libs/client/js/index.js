/**
 * 客户端接口API库
 * 用于实现测试用例中的open、run
 */
(function () {

    var WIN = this;

    /**
     * 载入依赖的脚本
     * 除去前四个脚本暂时不解释，一下是依赖关系
     * [x]jquery1.7.2 和uitest保持一致
     * [x]jquery.tmpl  jquery的模板插件 类似TEMPLATE 和uitest保持一致
     * [x]json方法   主要是实现一个通用的JSON 方便低级浏览器 和uitest保持一致
     * [x]jasmine类  实现jasmine的各种方法 这个类是原生的jasmine UT类的方法实现转移到UITest中
     * [x]jasmine-html jasmine的可视化结果输出方法 和uitest保持一致  可以不保留 看以后情况
     * [x]simulate 为jasmine提供各种模拟事件 在uitest基础上增强，对默写事件提供真是的鼠标动作，比如点击、滚动等
     * [x]matcher  为jasmine提供预匹配语法 和uitest保持一致 可考虑后期用webdriver实现
     * [x]taobao   在jasmine下增加taobao命名空间， 提供简单的一些功能集合 如taobao.login
     */
    _loadScript([
        'http://localhost:3000/js/libs/Do.js',
        'http://localhost:3000/js/libs/socket.io/socket.io.js',
        'http://localhost:3000/js/libs/traceKit.js',

        'http://localhost:3000/js/libs/jquery-1.7.2.min.js',
        'http://localhost:3000/js/libs/jquery.tmpl.js',
        'http://localhost:3000/js/libs/json.js',
        'http://localhost:3000/js/libs/jasmine.js',
        'http://localhost:3000/js/libs/jasmine-html.js',
        'http://localhost:3000/js/libs/simulate.js',
        'http://localhost:3000/js/libs/matcher.js',
        'http://localhost:3000/js/libs/taobao.js',

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
