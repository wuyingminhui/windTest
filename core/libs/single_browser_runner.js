/**
 * 执行用户脚本
 * @author neekey<ni184775761@gmail.com>
 * @date 2012.11.29
 */

var Tool = require( './utils' );
var WebdriverNode = require('webdriverNode/lib/core/webdriverNode');
// 脚本执行的超时
var TIME_OUT = 10000000;

/**
 * 在单个浏览器中执行脚本
 * @param {Object} userScriptChunk 用户脚本
 * @param {String} browser
 * @param {Array} libs
 * @constructor
 */
var SingleBrowserRunner = function( userScriptChunk, browser, libs ){

    // 配置全局数据
    this._setupData();
    // 配置WebdriverNode
    this._setupWebdriverNode();
    this._userScriptChunk = userScriptChunk;
    this._browser = browser;
    this._libs = libs;
};

/**
 * 执行测试用例
 * @param {Function} next ( testResult )测试用例执行完毕后的回调函数
 */
SingleBrowserRunner.prototype.run = function( next ){
    // 设置超时
    this._setTimeout( TIME_OUT );
    // 执行脚本，并在脚本执行完毕后执行回调
    Tool.scriptExec({
        exeData: this._userScriptChunk,
        client: this.client,
        libs: this._libs,
        next: function( data ){
            next( data.testResult );
        }
    });
};

/**
 * 初始化webdriverNode实例对象
 * @private
 */
SingleBrowserRunner.prototype._setupWebdriverNode = function(){
    this.client = WebdriverNode.remote({
        desiredCapabilities:{
            browserName: this._browser
        }
    });
};

/**
 * 设置Session执行脚本超时时间
 * @param {Number} timeout
 * @private
 */
SingleBrowserRunner.prototype._setTimeout = function( timeout ){
    // 设置超时
    this.client.protocol.timeoutsAsyncScript( timeout );
};

module.exports = SingleBrowserRunner;