/**
 * 测试用例的执行
 */
var FS = require('fs');
var Util = require( 'util' );
var path = require('path');
var EventEmitter = require( 'events').EventEmitter;
var _ = require( 'underscore' );
var Tool = require('./utils.js');

var webdriverNode = require('webdriverNode/lib/core/webdriverNode');
var targetFile = args[0];
var userScript = FS.readFileSync(targetFile, 'utf-8');
var userScriptChunks = Tool.parser(userScript);


var ScriptRunner = function( obj ){
    EventEmitter.call(this);
    this._parse( obj );
    this._dataSetup();
    this._setupWebdriverNode();
};

Util.inherits( Communicate, EventEmitter );

ScriptRunner.prototype.run = function(){
    // 设置超时
    this.client.protocol.timeoutsAsyncScript(1000000);
};

ScriptRunner.prototype._parse = function( config ){

    this.targetFile = Path.resolve( config.targetFile );
    // todo 默认先用UTF-8，之后可以考虑自动检测文件编码，或者根据参数指定
    this.userScript = FS.readFileSync(targetFile, 'utf-8');
    // 预先解析用户脚本
    this.userScriptChunks = Tool.parser( this.userScript );
    // 脚本执行的依赖JS库
    this.libs = _.isArray( config.libs ) ? config.libs : [ config.libs ];
};



var SingleBrowerRunner = function( userScriptChunks, browser ){
    EventEmitter.call(this);
    this.userScriptChunks = userScriptChunks;
    this.browserName = browser;
};
Util.inherits( Communicate, EventEmitter );

SingleBrowerRunner.prototype.run = function(){


};

//定义全局变量空间，用于存储一些跨区域变量
SingleBrowerRunner.prototype._dataSetup = function(){

    this.__Jas = {
        data:{
            _data:{},
            get:function (attr) {
                return this._data[ attr ];
            },
            set:function (attr, value) {
                this._data[ attr ] = value
            },
            toJSON:function () {
                return this._data;
            }
        },
        testResult:[]
    };
};

SingleBrowerRunner.prototype._setupWebdriverNode = function(){

    this.client = webdriverNode.remote({
        desiredCapabilities:{
            browserName: this.browserName
        }
    });
};

//        Utils.scriptExec(userScriptChunks, client, __Jas);
