    Wind.open( 'http://taobao.com', function( W ){

        W.close();
    });

    var tbWin = Wind.open( 'http://taobao.com', function(){

    });

    tbWin.when( 'http://item.taobao.com', function(){


        Wind.frame( '#frame', function(){

        });

        Wind.do(function(){

        });
    });