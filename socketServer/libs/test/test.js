/**
 * 与测试调度相关
 * 1、与webdriver进行通信
 * 2、对session数据进行操作
 */

var TestSession = require( '../redis/session' );
var TestDriver = require( '../webdriver/webdriver' );

module.exports = {

    /**
     * @name NewTestCallback
     * @function
     * @param {Object=null} err
     * @param {Object} result
     * @param {String} result.sessionId 会话sessionId
     * @param {String} result.winId 新开的窗口ID
     */

    /**
     * 创建一个新的测试
     * @param {Object} testInfo
     * @param {String} testInfo.url 需要测试的页面地址
     * @param {String} testInfo.browserName 需要测试的浏览器名称
     * @param {String} testInfo.code 需要执行的用户测试用例
     * @param {String} [testInfo.sessionId] 会话Id
     * @param {String} [testInfo.winId] 窗口id
     * @param {NewTestCallback} next
     */

    newTest: function( testInfo, next ){

        // 检查sessionId是否存在，如果存在，则查找当前的globalData
        if( testInfo.sessionId ){
            new TestSession( testInfo.sessionId, function( err, S ){
                if( err ){
                    next( err );
                }
                else {
                    S.globalData(function( err, g ){
                        if( err ){
                            next( err );
                        }
                        else {
                            testInfo.globalData = g;
                            TestDriver.newTest( testInfo, function( sessionId, winId ){


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
                        }
                    });
                }
            });
        }
        else {
            testInfo.globalData = {};

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
        }
    },

    /**
     * @name GetAllTestResultCallback
     * @function
     * @param {Array} resultList
     * @param {Array} resultList.winId
     * @param {Array} resultList.testResult
     */

    /**
     * 获取会话中包含的所有的测试结果
     * @param {String} sessionId
     * @param {GetAllTestResultCallback} next
     */

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
     * @name FinishCallback
     * @function
     * @param {Object} result
     * @param {String} result.sessionId
     * @param {String} result.winId
     * @param {Boolean} result.ifAllFinish 是否该会话下的所有窗口都测试完毕
     * @param {Object} result.winResult 当前窗口的测试结果
     * @param {Object} [result.allResult] 所有窗口的测试结果
     * @param next
     */

    /**
     * 当一次窗口的测试结束
     * @param {Object} testInfo
     * @param {String} testInfo.sessionId
     * @param {String} testInfo.winId
     * @param {Object} testInfo.testResult 该窗口中的测试结果
     * @param {FinishCallback} next
     */

    finish: function( testInfo, next ){

        // 获取测试相关信息
        var sessionId = testInfo.sessionId;
        var winId = testInfo.winId;
        var testResult = testInfo.testResult;
        var self = this;

        var session = new TestSession( sessionId, function(){

            // 储存测试结果
            session.getWin( winId, function( err, winObj ){
                winObj.testResult = testResult || {};
                winObj.stat = 'done';


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
    },

    /**
     * @name GetGlobalDataCallback
     * @function
     * @param {Object=null}  err
     * @param {Object} globalData
     */

    /**
     * 获取全局数据
     * @param sessionId
     * @param {GetGlobalDataCallback} next
     */

    getGlobalData: function( sessionId, next ){
        var session = new TestSession( sessionId, function(){

            session.globalData( next );
        });
    },

    /**
     * @name SetGlobalDataCallback
     * @function
     * @param {Object=null}  err
     * @param {Object} globalData
     */

    /**
     * 设置全局数据
     * @param sessionId
     * @param {Object} data
     * @param {SetGlobalDataCallback} next
     */

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