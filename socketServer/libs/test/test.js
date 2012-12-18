/**
 * 与测试调度相关
 * 1、与webdriver进行通信
 * 2、对session数据进行操作
 */

var TestSession = require( '../redis/session' );
var TestDriver = require( '../webdriver/webdriver' );

module.exports = {

    /**
     * 创建一个新的测试
     * @param testInfo
     * @param next
     */

    newTest: function( testInfo, next ){
        TestDriver.newTest( testInfo, function( sessionId, winId ){

            new TestSession( sessionId, function( err, S ){

                if( err ){
                    next( err );
                }
                else {
                    // addWin
                    S.addWin( winId, { parentId: testInfo.winId, stat: 'running' }, function( err ){

                        if( err ){
                            next( err );
                        }
                        else {
                            next( err, { sessionId: sessionId, winId: winId } );
                        }
                    });
                }
            });
        });
    },

    getAllTestResult: function( sessionId, next ){

        var resultList = [];
        var session = new TestSession( sessionId, function(){
            session.getAllWins(function( err, winList ){
                winList.forEach(function( win ){
                    resultList.push( win.testResult );
                });

                // 暂时先输出所有的窗口信息
                resultList = winList;

                next( resultList );
            });
        });
    },

    /**
     * 一次测试完毕
     * 1、记录该次测试的结果
     * 2、检查是否所有测试都已经结束
     * 3、通知webdriverNode Win (?)
     * @param testInfo
     * @param next
     */

    finish: function( testInfo, next ){

        // 获取测试相关信息
        var sessionId = testInfo.sessionId;
        var winId = testInfo.winId;
        var testResult = testInfo.testResult;
        var globalData= testInfo.globalData || {};
        var self = this;

        var session = new TestSession( sessionId, function(){

            // 储存测试结果
            session.getWin( winId, function( err, winObj ){
                winObj.testResult = testResult || {};
                winObj.stat = 'done';

                // 储存globalData
                session.setGlobalData( globalData, function(){

                    // 保存win数据
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

                                    // 销毁session数据
                                    session.destroy();
                                } );
                            });
                        }
                    });
                });
            });
        });
    },

    getGlobalData: function( sessionId, next ){
        var session = new TestSession( sessionId, function(){

            session.globalData( next );
        });
    },

    setGlobalData: function( sessionId, data, next ){

        var session = new TestSession( sessionId, function(){

            session.globalData( function( err, d ){

                if( err ){
                    next( err );
                }
                else {
                    var key;
                    for( key in data ){
                        d[ key ] = data[ key ];
                    }

                    session.setGlobalData( d, function( err ){
                        if( err ){
                            next( err );
                        }
                        else {
                            next( null, d );
                        }
                    });
                }
            } );
        });
    }
};