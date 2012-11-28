/**
 * 脚本环境配置与启动
 */
var path = require('path');
var Utils = require('./utils.js');
var CONFIG = require( './config.json' );
var PLATFORM = process.platform;

// Selenium server jar 位置
var Selenium_Server = path.resolve( __filename, CONFIG.SELENIUM_SERVER_JAR_PATH );
// Chrome dirver 位置
var ChromeDriver = path.resolve( __filename, CONFIG.CHROME_DRIVER_PATH );
// 检查是否为windows
if( PLATFORM.indexOf( 'win' ) == 0 ){
    ChromeDriver += '.exe';
}
// 用于启动selenium server的命令
var SeleniumSetupCommand = [
    '/c', 
    'java', 
    '-jar', 
    Selenium_Server, 
    '-Dwebdriver.chrome.driver=' + ChromeDriver
];

module.exports = {

    /**
     * 初始化环境(启动selenium服务器)
     * @param {Function} next ( err )
     */
    init: function( next ){
        Utils.exec( SeleniumSetupCommand, function ( result ) {
            //启动后每一行都是一个data，通过检查data来查看是否成功启动了server
            if ( result.data.indexOf( 'Started org.openqa.jetty.jetty.Server' ) != -1
                || result.data.indexOf( 'Selenium is already running on port' ) != -1) {

                next( null );
            }
            if(result.type == 'ERROR' && result.data.indexOf( 'java' ) != -1){
                var errorMsg = 'Do Not Find java, plaese install java runtime!';
                console.error( errorMsg );
                next( { msg: errorMsg });
            }
        });
    }
};
