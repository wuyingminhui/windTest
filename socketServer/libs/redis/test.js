var assert = require( 'assert' );
var SessionMgr = require( './session' );
var Config = require( './config.json' );

describe('Session Test', function(){

    var sessionIst;
    var sessionId = '__REDIS_WIN_TEST_SESSIONID__';
    var winList = [ 16, 17, 18 ];

    it( 'Static Method #sessionId(), #keyToSessionId()', function(){

        // ID to KEY
        var expectSessionKey = Config.SESSION_PREFIX + sessionId;
        var actualSessionKey = SessionMgr.sessionId( sessionId );
        assert.equal( expectSessionKey, actualSessionKey );

        // KEY to ID
        var expectSessionId = sessionId;
        var actualSessionId = SessionMgr.keyToSessionId( actualSessionKey );
        assert.equal( actualSessionId, expectSessionId );

    });

    it( 'Static Method #winId()', function(){

        var windId = 22;

        // ID to KEY
        var expectWinKey = Config.SESSION_PREFIX + sessionId + ':' + Config[ 'WIN_PREFIX' ] + windId;
        var actualWinKey = SessionMgr.winId( sessionId, windId );
        assert.equal( actualWinKey, expectWinKey );

        // KEY to ID
        var expectWinId = windId;
        var actualWinId = SessionMgr.keyToWinId( actualWinKey );
        assert.equal( actualWinId, expectWinId );
    });

    it( '#init()', function( done ){

        sessionIst = new SessionMgr( sessionId, function(){
            assert.equal( sessionIst.sessionId, sessionId );
            done();
        });
    });

    it( '#clientData()', function( done ){

        // 默认的话应该是不存在clientData值的
        sessionIst.clientData(function( err, c){

            assert.equal( undefined, c );

            var newClientData = {
                sessionId: '2897980098',
                desiredCapabilities: {
                    browserName: 'chrome'
                }
            };

            // 设置新值
            sessionIst.setClientData( newClientData, function( err ){

                sessionIst.clientData( function( err, d ){

                    // 检验是否设置成功
                    assert.deepEqual( d, newClientData );
                    done();
                });
            });
        });
    });

    it( '#globalData()', function( done ){

        // 获取默认值
        sessionIst.globalData(function( err, d ){
            assert.deepEqual( d, {} );

            var newGlobalData = {
                name: 'redis',
                info: {
                    version: '1.0'
                }
            };

            // 设置新值
            sessionIst.setGlobalData( newGlobalData, function( err ){

                sessionIst.globalData(function( err, d ){

                    // 检验是否设置成功
                    assert.deepEqual( d, newGlobalData );
                    done();
                });
            });
        });
    });

    it( '#addWin(), #getWin(), #setWin()', function( done ){

        var winId = winList[ 0 ];

        /**
         * 注意到，Redis中的基本数值都是String
         */

        var winInfo = {
            parentId: '22',
            stat: 'running',
            winId: winId
        };

        // addWin() & getWin()
        sessionIst.addWin( winId, winInfo, function(){
            sessionIst.getWin( winId, function( err, win ){
                assert.deepEqual( win, winInfo );

                // setWin()
                var stat = 'finished';
                sessionIst.setWin( winId, { stat: stat }, function(){

                    sessionIst.getWin( winId, function( err, w ){
                        var expectWinObj = {
                            parentId: '22',
                            stat: stat,
                            winId: winId
                        };
                        assert.deepEqual( w, expectWinObj );
                        done();
                    });
                });
            });
        });
    });

    it( '#getAllWinIds(), #getAllWin', function( done ){

        // addAllWin
        var parentId = 14;

        function addWinList( list, index, next ){
            index = ( typeof index == 'undefined' ? 0 : index );
            var winId = list[ index ];

            if( winId === undefined ){
                next();
            }
            else {
                sessionIst.addWin( winId, { parentId: parentId }, function(){
                    addWinList( list, index + 1, next );
                });
            }
        }

        addWinList( winList.slice( 1 ), undefined, function(){

            // #getAllWinIds()
            sessionIst.getAllWinIds(function( err, ret ){
                assert.equal( winList.length, ret.length );
                for( var i = 0; i < winList.length; i++ ){
                    assert( true, winList.indexOf( ret[ i ]) >= 0 );
                }

                // #getAllWins()
                sessionIst.getAllWins(function( err, wins ){

                    assert.equal( wins.length, winList.length );
                    wins.forEach(function( win ){

                        assert.equal( typeof win, 'object' );
                        assert.notEqual( win.parentId, undefined );
                    });
                    done();
                });

            });
        });
    });

    it( '#removeWin()', function( done ){

        var newWinId = 55;
        var winInfo = {
            parentId: 56
        };
        sessionIst.addWin( newWinId, winInfo, function( err ){

            sessionIst.getWin( newWinId, function( err, win ){

                assert.deepEqual( win, winInfo );

                // #removeWin
                sessionIst.removeWin( newWinId, function(){

                    sessionIst.getWin( newWinId, function( err, win ){

                        assert.equal( win, undefined );
                        done();
                    });
                });
            });
        });
    });

    it('#expire normal', function( done ){


        var newSessionId = '__REDIS_WIN_TEST_SESSIONID_EXPIRE_';
        // 添加一个
        var newSession = new SessionMgr( newSessionId, function(){

            // 设置超时时间为5s
            newSession.setExpireTimeout( 5 );
            // 更新超时
            newSession.setExpire(function(){
                // 先检查现在具有
                SessionMgr.sessionExist( newSessionId, function( err, ifExist ){
                    assert.equal( true, ifExist );

                    // 4s后应该还没销毁
                    setTimeout(function(){
                        SessionMgr.sessionExist( newSessionId, function( err, ifExist ){

                            assert.equal( true, ifExist );

                            // 5s后应该销毁了
                            setTimeout(function(){
                                SessionMgr.sessionExist( newSessionId, function( err, ifExist ){
                                    assert.equal( false, ifExist );
                                    done();
                                });
                            }, 1000);
                        });
                    }, 4000 );
                });
            });
        });
    });

    it( '#expire active',function( done ){

        var newSessionId = '__REDIS_WIN_TEST_SESSIONID_EXPIRE_';
        // 添加一个
        var newSession = new SessionMgr( newSessionId, function(){

            // 设置超时时间为5s
            newSession.setExpireTimeout( 5 );
            // 更新超时
            newSession.setExpire(function(){
                // 先检查现在具有
                SessionMgr.sessionExist( newSessionId, function( err, ifExist ){
                    assert.equal( true, ifExist );

                    // 4s后应该还没销毁
                    setTimeout(function(){
                        SessionMgr.sessionExist( newSessionId, function( err, ifExist ){

                            assert.equal( true, ifExist );

                            newSession.setExpire(function(){
                                // 5s后由于中间又被激活过，因此没有销毁
                                setTimeout(function(){
                                    SessionMgr.sessionExist( newSessionId, function( err, ifExist ){
                                        assert.equal( true, ifExist );

                                        // 4s后应该还没销毁
                                        setTimeout(function(){
                                            SessionMgr.sessionExist( newSessionId, function( err, ifExist ){

                                                assert.equal( true, ifExist );

                                                // 5s后由于中间又被激活过，因此没有销毁
                                                setTimeout(function(){
                                                    SessionMgr.sessionExist( newSessionId, function( err, ifExist ){
                                                        assert.equal( false, ifExist );
                                                        done();
                                                    });
                                                }, 1000);
                                            });
                                        }, 3000 );
                                    });
                                }, 1000);
                            });
                        });
                    }, 4000 );
                });
            });
        });
    });

    it( '#destroy()', function(done){
        sessionIst.destroy(function(){
            SessionMgr.sessionExist( sessionId, function( err, ifExist ){
                assert.equal( false, ifExist );
                done();
            });
        });
    });
});