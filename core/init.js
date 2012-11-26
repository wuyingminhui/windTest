var FS = require('fs');
var path = require('path');
var Utils = require('./utils.js');


var webdriverNode = require('../node_modules/webdriverNode/lib/core/webdriverNode');
var args = process.argv.splice(2);
var targetFile = args[0];
var userScript = FS.readFileSync(targetFile, 'utf-8');
var userScriptChunks = Utils.parser(userScript);

//selenium server jar λ��
var Selenium_Server = path.normalize(__dirname + '/../selenium.server/selenium-server-standalone-2.11.0.jar');
var ChromeDriver = path.normalize('./selenium.server/chromedriver.exe');

//����ȫ�ֱ����ռ䣬���ڴ洢һЩ���������
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
    //������ÿһ�ж���һ��data��������ֶ˿ڿ����ɹ�����ô�ͳ�ʼ��client
    if (result.data.indexOf("Started org.openqa.jetty.jetty.Server") != -1 || result.data.indexOf("Selenium is already running on port") != -1) {
        //�˴�Ĭ�ϳ�ʼ��Ϊchrome�����ڿ�ָ������������ý�ͼ����� todo
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
