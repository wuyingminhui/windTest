UITest.open("test1.html", function () {
    describe("class", function () {
        it("has class", function () {
            expect("#target").toHaveClass("default");

            UITest.open( 'http://baidu.com', function(){

            });

            UITest.goWin( parent, function(){

            });
        })
    })

});

run1Body -> test1.html -> run --> run2 --> run2Body --> baidu.com -> run2

goWin --> paret --> getwin ->>gwinBody --> win