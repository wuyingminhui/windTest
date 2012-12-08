/**
 * 与测试调度相关
 */
var TestSession = require( '../redis/session' );
var TestDriver = require( '../webdriverNode' );

module.exports = {

    create: function( testInfo, next ){
//        var pageURL = testInfo.url;
//        var testCode = testInfo.code;
//        var sessionId = testInfo.sessionId;
//        var parentId = testInfo.parentId;

        TestDriver.newTest( testInfo, function( sessionId, winId ){

            var session = new TestSession( sessionId, function(){

                // addWin
                session.addWin( winId, { parentId: testInfo.parentId, stat: 'running' }, function(){
                    next( { sessionId: sessionId, winId: winId } );
                });
            });
        });
    },

    finish: function( sessionId, next ){
        TestDriver.finishSession( sessionId, next );
    }
};