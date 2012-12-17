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
        var winInfo = {
            parentId: 22,
            stat: 'running'
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
                            parentId: 22,
                            stat: stat
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

    it( '#destroy', function(done){
        sessionIst.destroy(function(){
            done();
        });
    });
});