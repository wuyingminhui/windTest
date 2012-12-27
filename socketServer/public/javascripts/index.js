var socket = io.connect();

$(document).ready(function(){

    var TESTURL = $( '.J_TestURL' );
    var TESTBrowser = $( '.J_TestBrowser' );
    var TESTCode = $( '.J_TestCode' );
    var TestTrigger = $( '.J_TestRun' );

    // 初始化ACE
    var editor = ace.edit( TESTCode.get(0) );
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    // 启动新测试
    TestTrigger.bind( 'click', function( event ){

        event.preventDefault();
        var testObj = {
            url: TESTURL.val(),
            browserName: TESTBrowser.val(),
            code: editor.getSession().getValue()
        };

        // 发送一个新测试请求
        socket.emit( 'NEW_TEST', testObj, function( ret ){

            if( ret.success ){
                // 订阅所有测试完成事件
                socket.emit( 'WAIT_ALL_TEST', ret.data, function( ret ){

                    if( ret.success ){
                        var testResult = ret.data;
                        var index
                            , value
                            , winId
                            , result
                            , HTML = '';

                        for( index = 0; value = testResult[ index]; index++ ){
                            winId = value[ 'winId' ];
                            result = value[ 'testResult' ];
                            HTML += '<tr><td>' + winId + '</td><td class="result-report">' + renderHTML(result) + '</td></tr>';
                        }

                        // 清空当前的数据
                        $( '.J_TestResultTable tbody').html( HTML );
                    }
                    else {
                        new Error( ret.err );
                    }
                });
            }
            else {
                new Error( ret.err );
            }
        });
    });
    function renderHTML (resultJSON) {
        var browserName = '';
        if($.browser.safari){
            browserName = 'safari';
        }else if($.browser.msie){
            browserName = 'msie';
        }else if($.browser.chrome){
            browserName = 'chrome';
        }else if($.browser.safari){
            browserName = 'safari';
        }else if($.browser.mozilla){
            browserName = 'mozilla';
        }else{
            browserName = 'noset';
        }
        resultJSON = {
            browser: browserName,
            version: $.browser.version,
            reports: JSON.parse(resultJSON)
        };

        var template =
            '<div class="browser">${browser} ${version}</div>' +
                '<div class="title {{if reports.failedSpecs !== 0}}fail-alert{{else}}passed-alert{{/if}}"><span>用例总数:${reports.totalSpecs} | 失败用例总数:${reports.failedSpecs}</span></div>' +
                '<div class="detail">{{each(index,suite) reports.suites}}' +
                '<div class="suite">' +
                '<span class="suite-title">${suite.description}</span>' +
                '{{each(index, spec) suite.specs}}' +
                '<div class="spec {{if spec.failed == true}}failed{{#else}}passed{{/if}}">' +
                '<a class="spec-title" href="#">${spec.description}</a>' +
                '<div class="detail">' +
                '{{each(index, result) spec.results_}}' +
                '{{each(index, item) result.items_}}' +
                '<p>' +
                'expect ${item.actual} ${item.matcherName} ' +
                '{{if item.expected !== ""}}${item.expected}{{/if}}' +
                '{{if item.passed_ == true}}' +
                '\t: ${item.message}{{else}}\t: Failed.' +
                '<div class="error-stack">${item.trace.stack}</div>' +
                '{{/if}}' +
                '</p>' +
                '{{/each}}' +
                '{{/each}}' +
                '</div>' +
                '</div>' +
                '{{/each}}' +
                '</div>' +
                '{{/each}}' +
                '</div>';
        var frg = $('<div>');
        jQuery.tmpl(template,resultJSON).appendTo(frg);
        return  frg.html();


    }

});