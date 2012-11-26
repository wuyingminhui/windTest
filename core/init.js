var FS = require('fs');
var path = require('path');
var Utils = require('./utils.js');


var webdriverNode = require('../node_modules/webdriverNode/lib/core/webdriverNode');
var args = process.argv.splice(2);
var targetFile = args[0];
var userScript = FS.readFileSync(targetFile, 'utf-8');
var userScriptChunks = Utils.parser(userScript);

//selenium server jar 位置
var Selenium_Server = path.normalize(__dirname + '/../selenium.server/selenium-server-standalone-2.11.0.jar');
var ChromeDriver = path.normalize('./selenium.server/chromedriver.exe');

//定义全局变量空间，用于存储一些跨区域变量
var __Jas = {
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
var client;
Utils.exec(["/c", "java", "-jar", Selenium_Server, "-Dwebdriver.chrome.driver=" + ChromeDriver], function (result) {
    //启动后每一行都是一个data，如果发现端口开启成功了那么就初始化client
    if (result.data.indexOf("Started org.openqa.jetty.jetty.Server") != -1 || result.data.indexOf("Selenium is already running on port") != -1) {
        //此处默认初始化为chrome，后期可指定浏览器，配置截图输出等 todo
        client = webdriverNode.remote({
            desiredCapabilities:{
                browserName:"chrome"
            }
        });
        client.init();
        client.protocol.timeoutsAsyncScript(1000000);

        Utils.scriptExec(userScriptChunks, client, __Jas);
    }
    if(result.type == 'ERROR' && result.data.indexOf('java') != -1){
        console.error('Do Not Find java, plaese install java runtime!');
    }
});
