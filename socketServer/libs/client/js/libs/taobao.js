/**
 * jasmine 增加一些方法
 * 不在jasmine源代码中增加  为了方便jasmine升级
 */
;(function(){
    debugger;

    if (typeof(jasmine) == 'undefined') {
        return ;
    }

    /**
     * @param mathersFunc
     * @return {Matcher}
     */
    jasmine.Spec.prototype.waitsMatchers = function (mathersFunc, timeout) {
        var host = this;
        if (!(mathersFunc && mathersFunc.apply)) {
            throw new Error("");
        }

        var waitsFunc = new jasmine.WaitsForMatchers(this.env, timeout, mathersFunc, this);

        this.addToQueue(waitsFunc);


        return this;
    };

    /**
     */
    var waitsMatchers = function (matchersFunc, timeout) {
        return jasmine.getEnv().currentSpec.waitsMatchers(matchersFunc, timeout);
    };
    if (isCommonJS) exports.waitsMatchers = waitsMatchers;
    window.waitsMathers = waitsMatchers;
})();

/*整合cloudyRun 功能
 * @origin  https://github.com/sorrycc/cloudyrun/tree/master/src/public/jasmine
 */
(function () {


    var $ = jQuery;

    jasmine.taobao = {
        config:{}
    };
    jasmine.taobao.slide = function (suite, container, options) {
        if (!suite || !(container = $(container)[0])) return;

        options = options || {};
        var triggers = options.triggers;
        var content = options.content || jQuery('.ks-switchable-content', container);
        var cssProp = options.cssProp || 'left';
        var eventType = options.eventType || 'click';
        var delay = options.delay || 100;

        describe(suite, function () {
            jQuery(triggers).each(function (i, trigger) {
                if ($(trigger).hasClass('disable')) return;
                it('trigger ' + i, function () {
                    jasmine.focus(container);
                    waits(1000);
                    var origin = $(content).css(cssProp);
                    jasmine.simulate(trigger, eventType);
                    waits(delay);
                    runs(function () {
                        expect($(content).css(cssProp)).not.toEqual(origin);
                    });
                });
            });
        });
    };

    jasmine.taobao.tab = function (suite, container, options) {
        if (!suite || !(container = $(container)[0])) return;

        options = options || {};
        var triggers = options.triggers || $('.ks-switchable-nav > *', container);
        var panels = options.panels || $('.ks-switchable-content > *', container);
        var eventType = options.eventType || 'click';
        var delay = options.delay || 100;

        describe(suite, function () {
            jQuery(triggers).each(function (i, trigger) {
                it('trigger ' + i, function () {
                    jasmine.focus(container);
                    waits(1000);
                    jasmine.simulate(trigger, eventType);
                    waits(delay);
                    runs(function () {
                        expect(panels[i].style.display).not.toEqual('none');
                    });
                });
            });
        });
    };

    jasmine.focus = (function () {
        var line;

        return function (el) {
            if (!(el = $(el)[0])) return;

            el.scrollIntoView();

            var offset = $(el).offset();
            var width = $(el).width();
            var height = $(el).height();

            if (!line) {
                line = jQuery('<div>').css({
                    position:'absolute',
                    border:'2px solid red',
                    zIndex:9999
                }).appendTo('body');
            }
            line.css({
                'left':offset.left,
                'top':offset.top,
                'width':width - 4,
                'height':height - 4
            });
        };
    })();

    jasmine.getLayout = function (i, e) {
        var exclude = [];
        $.each(e, function () {
            $($.trim(this)).each(function () {
                if ($.inArray(this, exclude) === -1) {
                    exclude.push(this);
                }
            });
        });

        var data = {};
        $.each(i, function () {
            $($.trim(this)).each(function () {
                if ($.inArray(this, exclude) > -1) {
                    return '';
                }

                if (/div|header|section|aside|article|footer|dl|ul|ol|p|h1|h2|h3|h4|h5/i.test(this.nodeName) &&
                    $.css(this, 'visibility') != 'hidden' &&
                    $.css(this, 'display') != 'none') {
                    var selector = $(this).getPath();
                    var l = getLayout(selector);
                    if (l) {
                        data[selector] = l;
                    }
                }
            });
        });

        try {
            data = JSON.stringify(data);
        } catch (e) {
            data = 'json parsing error!';
        }

        return data;
    };

    // Extend jasmine.
    jQuery.extend(jasmine.Matchers.prototype, {

        // Horizontal layout test.
        toHorizontalEqual:function () {
            // console.log(this.actual);
            return equal(this.actual, ['top', 'height']);
        },
        toHorizontalTopAlign:function () {
            return equal(this.actual, ['top']);
        },
        toHorizontalBottomAlign:function () {
            return equal(this.actual, ['top+height']);
        },

        // Vertical layout test.
        toVerticalEqual:function () {
            return equal(this.actual, ['left', 'width']);
        },
        toVerticalLeftAlign:function () {
            return equal(this.actual, ['left']);
        },
        toVerticalRightAlign:function () {
            return equal(this.actual, ['left+width']);
        },

        // Prop test.
        isCSSProp:function (prop, compare, val) {
            var propVal = jQuery(this.actual).css(prop);
            if (/^\d+/.test(propVal)) {
                propVal = parseInt(propVal, 10);
                val = parseInt(val, 10);
            }
            switch (compare) {
                case '=':
                case '==':
                    return propVal == val;
                case '===':
                    return propVal === val;
                case '<':
                    return propVal < val;
                case '>':
                    return propVal > val;
                case '<=':
                    return propVal <= val;
                case '>=':
                    return propVal >= val;
            }
            return false;
        },

        toEqualLayout:function (diff) {
            var d = JSON.parse(this.actual);
            var failed = [];

            diff = diff || {};
            if (typeof diff === 'number') {
                diff = {'width':diff, 'height':diff, 'left':diff, 'top':diff};
            }

            for (var selector in d) {
                var el = $(selector)[0];
                if (!el) {
                    continue;
                }
                var currentLayout = getLayout(el);
                if (currentLayout) {
                    var compareResult = compare(currentLayout, d[selector], selector, diff);
                    if (compareResult !== true) {
                        failed.push(compareResult);
                    }
                }
            }

            if (failed.length > 0) {
                throw new Error(failed.join('\n'));
            }
            return true;
        }
    });


    ///////////////////////////////////////////////////////////////
    // Helpers

    // Get el's left, top, width, height, and so on..
    var offset = function (el) {
        var data = jQuery.data(el, 'offset');
        if (!data) {
            var e = jQuery(el),
                f = e.offset(), w = e.width(), h = e.height();
            data = {
                'left':f.left,
                'top':f.top,
                'width':w,
                'height':h,
                'left+width':f.left + w,
                'top+height':f.top + h
            };
            jQuery.data(el, 'offset', data);
        }
        return data;
    };

    // Compare el's offset.
    var equal = function (els, opts) {
        var cache = {},
            i, j,
            notexsit = function () {
                for (j = 0; j < opts.length; j++) {
                    if (!cache[opts[j]]) return true;
                }
                return false;
            },
            notequal = function (os) {
                for (j = 0; j < opts.length; j++) {
                    if (os[opts[j]] !== cache[opts[j]]) return true;
                }
                return false;
            };

        for (i = 0; i < els.length; i++) {
            var os = offset(jQuery(els[i]).get(0));

            if (notexsit()) {
                for (j = 0; j < opts.length; j++) {
                    cache[opts[j]] = os[opts[j]];
                }
                continue;
            }

            if (notequal(os)) {
                return false;
            }
        }

        return true;
    };

    function compare(current, origin, selector, diff) {
        // check
        var props = ['width', 'left', 'height', 'top'];
        var i;
        for (i = 0; i < props.length; i++) {
            if (!(props[i] in current) || !(props[i] in origin)) return;
        }

        // 100% w
        if (current.width === '100%' && origin.width === '100%') {
            // remove width & height
            props.splice(0, 2);
        }

        // compare props
        for (i = 0; i < props.length; i++) {
            var c = current[props[i]];
            var o = origin[props[i]];
            if (Math.abs(c - o) > (diff[props[i]] || 0)) {
                return selector + ' ' + props[i] + ' diff: ' + (c - o);
            }
        }

        return true;
    }

    function getLayout(selector) {
        var el = $(selector)[0];
        var offset = $(el).offset();
        var width = $(el).width();
        var height = $(el).height();
        // var docWidth = $(document).width();
        var docWidth = document.documentElement.clientWidth;

        if (width === 0 || height === 0) return;

        return {
            left:Math.ceil(offset.left - docWidth / 2),
            top:offset.top,
            width:width === docWidth ? '100%' : width,
            height:height
        };
    }

    jQuery.fn.getPath = function () {
        var path, node = this;
        if (node[0].id) {
            return '#' + node[0].id;
        }
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var siblings = parent.children(name);
            if (siblings.length > 1) {
                name += ':eq(' + siblings.index(realNode) + ')';
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    };

})();


(function () {

    var online = document.domain.indexOf('taobao.com') > -1;
    var domain = online ? 'taobao.com' : 'taobao.net';
    var domain2 = online ? 'taobao.com' : 'daily.taobao.net';


 jasmine.taobao.login = function (username, password) {
        _login(username, password);
    };

    /*
     UT.taobao.logout = jasmine.taobao.logout = function () {
     _logout();
     };

     function _logout() {
     var img = new Image();
     img.src = 'http://login.' + domain2 + '/member/logout.jhtml?f=top&t=' + (+new Date());
     setTimeout(function () {
     location.reload();
     }, 1000);
     }
     */

    function _login(username, password) {
        var src = 'http://login.' + domain2 + '/member/login.jhtml?style=minisimple&from=buy' +
            '&full_redirect=false&redirect_url=' + encodeURI('http://www.' + domain2 + '/go/act/uitest/login.php');

        UT.setData({
            username:username,
            password:password
        })

        var runner = UT.open(src, function () {
            describe("登录", function () {
                it("获取数据并提交登录", function () {
                    var info;
                    UT.getData(function (data) {
                        info = data;
                    });

                    waitsMatchers(function () {
                        console.log(info)
                        expect(info).toBeDefined();
                    });
                    runs(function () {
                        try {
                            var doc = document;
                            var forms = doc ? doc.getElementsByTagName('form') : null;
                            forms[0]['TPL_username'].value = info.username;
                            forms[0]['TPL_password'].value = info.password;

                            forms[0].submit();
                        } catch (e) {

                        }
                    })


                })
            })


        })

        runner.goon(function () {
            describe("登录", function () {
                it("判断登录成功", function () {
                    expect(window.loginsuccess).toBeDefined();
                })
            })
        })


    }

})();
//重新定义命名空间
(function(){
    UT.taobao = jasmine.taobao;
})();