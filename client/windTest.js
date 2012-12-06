/**
 * Created with IntelliJ IDEA.
 * @author neekey
 * @date 12-12-5
 */
(function(){

    var WindTest = function(){
    };

    WindTest.prototype = {

        /**
         * 在制定目标中执行测试用例
         * @param {String|Frame} target  \
         * @param fn
         */
        runTest: function( target, testBody, next ){},

        /**
         * 当前页面用例执行完毕
         * @param resultData 准备返回给server的数据
         */
        finishTest: function( resultData ){}
    };

    var MessageManager = function(){};

    MessageManager.prototype = {

        /**
         * 用户连接服务器
         * @param host
         */
        connect: function( host ){},

        /**
         * 发送消息
         * @param msgType
         * @param msg
         */
        emit: function( msgType, msg ){},

        /**
         * 监听消息
         * @param msgType
         */
        on: function( msgType ){}
    };

    var SessionManager = function( sessionId, pageId, parentPageId ){
        this.sessionId = undefined;
        this.pageId = undefined;
        this.parentTestId = undefined;
    };

    SessionManager.prototype = {

        /**
         * 本次Selenium会话ID
         * @private
         * @type {String|Number}
         */
        _sessionId: undefined,

        /**
         * 本页面Id，每一次测试会为会话中所有打开的页面都设置一个唯一的pageId
         * @private
         * @type {String|Number}
         */
        _pageId: undefined,

        /**
         * 打开当前页面的页面的pageId，如果为顶层页面，则`pageId == parentPageId`
         * @private
         * @type {String|Number}
         */
        _parentPageId: undefined,

        initSession: function( sessionId ){}
    };

    var GlobalData = function( data ){
        data = data || {};

        this.get = function ( attr ) {
            return data[ attr ];
        };

        this.set = function (attr, value) {
            data[ attr ] = value;
        };

        this.toJSON = function(){
            return data;
        };

        this.setData = function( d ){
            data = d;
        };
    };

})();
