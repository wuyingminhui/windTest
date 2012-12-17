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
                session.addWin( winId, { parentId: testInfo.winId, stat: 'running' }, function(){
                    next( { sessionId: sessionId, winId: winId } );
                });
            });
        });
    },

    getAllTestResult: function( sessionId, next ){

        var resultList = [];
        var session = new TestSession( sessionId, function(){
            session.getAllWins(function( err, winList ){
                console.log( 'ALL WIN LIST!!!!',winList );

                winList.forEach(function( win ){
                    resultList.push( win.testResult );
                });

                next( resultList );
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

        // 获取测试相关信息
        var sessionId = testInfo.sessionId;
        var winId = testInfo.winId;
        var parentId = testInfo.parentId;
        var testResult = testInfo.testResult;
        var self = this;

        var session = new TestSession( sessionId, function(){

            console.log( 'IN SESSION:!!!', testInfo );
            // 储存测试结果
            session.getWin( winId, function( err, winObj ){
                console.log( 'IN GET WIN:!!!', winObj );
                winObj.testResult = testResult || {};
                winObj.stat = 'done';

                session.setWin( winId, winObj, function(){

                    var parentId = winObj.parentId;
                    if( parentId && parentId !== 'undefined' ){
                        // 关闭当前window
                        TestDriver.closeWindow( sessionId, winId, function(){
                            next({
                                sessionId: sessionId,
                                winId: winId,
                                ifAllFinish: false,
                                winResult: testResult
                            });
                        });
                    }
                    // 如果parentId为空，则表示当前win就是父页面，则结束session
                    else {
                        // 获取所有的测试结果
                        self.getAllTestResult( sessionId, function( resultList ){
                            TestDriver.finishSession( sessionId, function(){
                                next({
                                    sessionId: sessionId,
                                    winId: winId,
                                    ifAllFinish: true,
                                    allResult: resultList,
                                    winResult: testResult
                                });
                            } );
                        });

                    }
                });
            });
        });
    }
};