/**
 * 与测试调度相关
 * 1、与webdriver进行通信
 * 2、对session数据进行操作
 */

var TestSession = require( '../redis/session' );
var TestDriver = require( '../webdriver/webdriver' );
var _ = require( 'underscore' );

module.exports = {

    /**
     * 创建一个新的测试
     * @param {Object} config
     * @param {String} config.url 需要测试的页面地址
     * @param {String} config.browserName 需要测试的浏览器名称
     * @param {String} config.code 需要执行的用户测试用例
     * @param {String} [config.sessionId] 会话Id
     * @param {String} [config.winId] 窗口id
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object} next.result 新测试信息
     * @param {String} next.result.sessionId 当前会话Id
     * @param {String} next.result.winId 新开窗口的sessionId
     */

    newTest: function( config, next ){

        var testInfo = _.clone( config );

        if( testInfo.sessionId ){

            new TestSession( testInfo.sessionId, function( err, S ){
                if( err ){
                    next( err );
                }
                else {

                    TestDriver.newTest( testInfo, function( err, sessionId, winId ){

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
        else {

            TestDriver.newTest( testInfo, function( err, sessionId, winId ){

                if( err ){
                    next( err );
                }
                else {
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
                }
            });
        }
    },

    /**
     * 获取会话中包含的所有的测试结果
     * @param {String} sessionId
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object[]} next.resultList 全部的测试结果
     * @param {String} next.resultList[].winId
     * @param {Object} next.resultList[].testResult
     */

    getAllTestResult: function( sessionId, next ){

        var resultList = [];
        new TestSession( sessionId, function( err, S ){

            if( err ){
                next( err );
            }
            else {
                S.getAllWins(function( err, winList ){

                    if( err ){
                        next( err );
                    }

                    else {
                        winList.forEach(function( win ){
                            resultList.push( win.testResult );
                        });

                        // 暂时先输出所有的窗口信息
                        resultList = winList;

                        next( null, resultList );
                    }
                });
            }
        });
    },

    /**
     * 当一次窗口的测试结束
     * @param {Object} testInfo
     * @param {String} testInfo.sessionId
     * @param {String} testInfo.winId
     * @param {Object} testInfo.testResult 该窗口中的测试结果
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object} next.result 窗口测试的结果描述
     * @param {String} next.result.sessionId
     * @param {String} next.result.winId
     * @param {Boolean} next.result.ifAllFinish 是否本次会话都结束了
     * @param {Object} next.result.winResult 当前结束窗口的测试结果
     * @param {Object[]} next.result.allResult 本次会话的所有测试结果
     */

    finish: function( testInfo, next ){

        // 获取测试相关信息
        var sessionId = testInfo.sessionId;
        var winId = testInfo.winId;
        var testResult = testInfo.testResult;
        var self = this;

        new TestSession( sessionId, function( err, S ){

            if( err ){
                next( err );
            }
            else {
                // 储存测试结果
                S.getWin( winId, function( err, winObj ){

                    if( err ){
                        next( err );
                    }
                    else {
                        winObj.testResult = testResult || {};
                        winObj.stat = 'done';

                        // 保存win数据
                        S.setWin( winId, winObj, function( err ){

                            if( err ){
                                next( err );
                            }
                            else {
                                var parentId = winObj.parentId;

                                if( parentId && parentId !== 'undefined' ){

                                    // 关闭当前window
                                    TestDriver.closeWindow( sessionId, winId, function( err ){
                                        if( err ){
                                            next( err );
                                        }
                                        else {
                                            next( null, {
                                                sessionId: sessionId,
                                                winId: winId,
                                                ifAllFinish: false,
                                                winResult: testResult
                                            });
                                        }
                                    });
                                }

                                // 如果parentId为空，则表示当前win就是父页面，则结束session
                                else {

                                    // 获取所有的测试结果
                                    self.getAllTestResult( sessionId, function( err, resultList ){

                                        if( err ){
                                            next( err );
                                        }
                                        else {
                                            TestDriver.finishSession( sessionId, function( err ){

                                                if( err ){
                                                    next( err );
                                                }
                                                else {
                                                    next( null, {
                                                        sessionId: sessionId,
                                                        winId: winId,
                                                        ifAllFinish: true,
                                                        allResult: resultList,
                                                        winResult: testResult
                                                    });
                                                }

                                                // 销毁session数据
                                                S.destroy();
                                            } );
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    },

    /**
     * 获取全局数据
     * @param sessionId
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object} next.globalData 全局数据
     */

    getGlobalData: function( sessionId, next ){
        var session = new TestSession( sessionId, function( err, S ){
            if( err ){
                next( err );
            }
            else {
                S.globalData( next );
            }
        });
    },

    /**
     * 设置全局数据
     * @param sessionId
     * @param {Object} data
     * @param {Function} next callback
     * @param {Object=null} next.err
     * @param {Object} next.globalData 全局数据
     */

    setGlobalData: function( sessionId, data, next ){

        var session = new TestSession( sessionId, function( err, S ){

            if( err ){
                next( err );
            }
            else {
                S.globalData( function( err, d ){

                    if( err ){
                        next( err );
                    }
                    else {
                        var key;
                        for( key in data ){
                            d[ key ] = data[ key ];
                        }

                        S.setGlobalData( d, function( err ){
                            if( err ){
                                next( err );
                            }
                            else {
                                next( null, d );
                            }
                        });
                    }
                });
            }
        });
    },

    /**
     * 为指定会话中的指定窗口添加一条错误记录
     * @param sessionId
     * @param winId
     * @param {Object} errorInfo
     * @param {Function} next callback
     * @param {Object=null} next.err
     */

    saveError: function( sessionId, winId, errorInfo, next ){

        new TestSession( sessionId, function( err, S ){

            if( err ){
                next( err );
            }
            else {
                S.addError( winId, errorInfo, function( err ){
                    if( err ){
                        next( err );
                    }
                    else {
                        next( null );
                    }
                });
            }
        });
    }
};