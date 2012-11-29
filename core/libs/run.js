/**
 * 测试用例的执行
 * @author neekey<ni184775761@gmail.com>
 * @date 2012.11.29
 */

var Util = require( 'util' );
var Path = require('path');
var Fork = require('child_process').fork;
var EventEmitter = require( 'events').EventEmitter;
var _ = require( 'underscore' );
var Parser = require('./parser');

/**
 * 脚本执行类
 * @param {String} obj.userScript 用户测试用例
 * @param {Array} obj.targetBrowsers 用户需要测试的浏览器列表
 * @param {Array} obj.libs 用户的测试用例需要依赖的JS库
 * @constructor
 */
var ScriptRunner = function( obj ){
    EventEmitter.call(this);
    this._parse( obj );
    this._attachEvent();
};
Util.inherits( ScriptRunner, EventEmitter );

/**
 * 开始执行测试用例
 */
ScriptRunner.prototype.run = function(){
    var self = this;
    this.targetBrowsers.forEach(function( browser){
        self._singleRun( browser );
    });
};

/**
 * 解析配置，并做相关的数据初始化
 *
 * @param {Object} config
 * @private
 */
ScriptRunner.prototype._parse = function( config ){

    var self = this;

    // 用户脚本
    this.userScript = config.userScript;
    // 预先解析用户脚本
    this.userScriptChunks = Parser.parse( this.userScript );
    // 用户指定需要测试的浏览器
    this.targetBrowsers = config.targetBrowsers;
    // 浏览器的执行状态
    this.browserStat = {};
    // 子浏览器测试进程们
    this.browserProcesses = {};
    // 各浏览器的测试结果
    this.testResult = {};
    // 脚本执行的依赖JS库
    this.libs = _.isArray( config.libs ) ? config.libs : [ config.libs ];

    // 初始化浏览器的执行状态，以及测试结果
    this.targetBrowsers.forEach(function( browser ){
        // 尚未开始
        self.browserStat[ browser ] = 'idle';
        self.testResult[ browser ] = {};
    });
};

/**
 * 绑定事件
 *
 * @event ScriptRunner#allBrowserFinished
 * @private
 */
ScriptRunner.prototype._attachEvent = function(){

    var self = this;

    this.on( 'singleBrowserFinished', function( data ){
        var browser = data.browser;
        var testResult = data.testResult;

        // 储存测试结果
        self._saveBrowserResult( browser, testResult );

        // 检查是否所有浏览器都已经执行完毕
        if( self._checkAllFinished() ){
            self.emit( 'allBrowserFinished', { result: self.testResult } );
        }
    });
};

/**
 * 开启一个线程执行单个浏览器的测试
 *
 * @event ScriptRunner#singleBrowserFinished
 * @param {String} browser
 * @private
 */
ScriptRunner.prototype._singleRun = function( browser ){
    if( browser in this.targetBrowsers ){

        var self = this;

        // 执行子进程，传递 用户脚本数据 和 需要测试的浏览器
        var child_process = this.browserProcesses[ browser ] = Fork(
            Path.resolve( __dirname, './child_run.js' ),
            [ JSON.stringify( this.userScriptChunks ), browser, this.libs ]
        );

        // 更改浏览器状态
        this._setBrowserStat( browser, 'running' );

        // 监听子进程信号
        child_process.on( 'message', function( msg ){
            if( msg.type == 'end' ){
                var testResult = msg.data.testResult;
                // 结束子进程
                child_process.kill();
                // 删除引用
                self.browserProcesses[ browser ] = null;
                // 更改浏览器状态
                self._setBrowserStat( browser, 'finished' );
                // 发出完成信号
                self.emit( 'singleBrowserFinished', {
                    testResult: testResult,
                    browser: browser
                } );
            }
        });
    }
};

/**
 * 设置浏览器状态
 * @param {String} browser
 * @param {String} stat idle|running|finished
 * @private
 */
ScriptRunner.prototype._setBrowserStat = function( browser, stat ){
    if( browser in this.targetBrowsers ){
        this.browserStat[ browser ] = stat;
    }
};

/**
 * 保存浏览器的测试结果
 * @param {String} browser
 * @param {Object} result
 * @private
 */
ScriptRunner.prototype._saveBrowserResult = function( browser, result ){
    if( browser in this.targetBrowsers ){
        this.testResult[ browser ] = result;
    }
};

/**
 * 检查是否所有浏览器都执行完毕
 * @return {boolean}
 * @private
 */
ScriptRunner.prototype._checkAllFinished = function(){

    var ifFinished = true;

    _.each( this.browserStat, function( stat ){

        if( stat != 'finished' ){
            ifFinished = false;
        }
    });

    return ifFinished;
};

module.exports = ScriptRunner;