/**
 * 与测试调度相关
 * 1、与webdriver进行通信
 * 2、对session数据进行操作
 */

var TestSession = require( '../redis/session' );
var TestDriver = require( '../webdriverNode' );

module.exports = {

    /**
     * 创建一个新的测试
     * @param testInfo
     * @param next
     */

    newTest: function( testInfo, next ){

        TestDriver.newTest( testInfo, function( sessionId, winId ){

            var session = new TestSession( sessionId, function(){

                // addWin
                session.addWin( winId, { parentId: testInfo.parentId, stat: 'running' }, function(){
                    next( { sessionId: sessionId, winId: winId } );
                });
            });
        });
    },

    /**
     * 一次测试完毕
     * 1、记录该次测试的结果
     * 2、检查是否所有测试都已经结束
     * 3、通知webdriverNode Win (?)
     * todo 4、需要通知parent这件事情
     * @param testInfo
     * @param next
     */

    finish: function( testInfo, next ){

        TestDriver.finishSession( testInfo.sessionId, next );
    }
};