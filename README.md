# WindTest

WindTest is an UI Test framework based on Selenium, and combine Selenium with browser framework.

## Features ( Still working on it… )

* Cross page UI Testing.
* High-privilege (Because selenium).
* Use Javascript to write test case.
* Multi-browser compatible.
* Automated regression testing.
* Multi-test-framework supported ( mocha/jasmine)

## Install & Begin

* clone this repo to your local.
* use `npm update` to install all the dependances.
* `node run.js` 
* That's all.

## Test case

All our test case is runing in browser, with the browser test frame work we build named `UITest`.

A simple test case will be like:

```javascript
UT.open('http://g.cn', function(){
  describe( 'desc', function(){
      it( 'it', function(){
          expect( 1 ).toBe( 1 );
      });
  });
});
UT.open( 'http://m.baidu.com', function(){
  describe( 'desc2', function(){
      it( 'it2', function(){
          expect( 1 ).toBe( 1 );
      });
  });
});
UT.done({ result: 'allTestDone'} );
```

This test case use `UT.open` method to open page that we want to test, and with the second param as the code to run in the target page.

Also, multi-call of `UT.open` will open multiple pages in order only when the last page is finished test.

More about `UITest`, see [UITest Document](https://github.com/taobao-sns-fed/windTest/wiki/UITest-Document)
