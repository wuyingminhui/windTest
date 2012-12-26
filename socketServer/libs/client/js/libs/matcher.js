
beforeEach(function () {
    var uiMatchers = {
        toHaveClass:function (className) {
            var nodeList = jQuery(this.actual);
            return nodeList.hasClass(className);

        },
        toBeVisible:function () {
            var nodeList = jQuery(this.actual);
            return nodeList.size() == nodeList.filter(':visible').size();
        },

        toBeHidden:function () {

            var nodeList = jQuery(this.actual);
            return nodeList.size() == nodeList.filter(':hidden').size();
        },

        toBeSelected:function () {
            var nodeList = jQuery(this.actual);
            return nodeList.filter(':selected').size() == nodeList.size();
        },

        toBeChecked:function () {

            var nodeList = jQuery(this.actual);
            return nodeList.filter(':checked').size() == nodeList.size();
        },

        toBeEmpty:function () {
            var nodeList = jQuery(this.actual);
            return nodeList.filter(':empty').size() == nodeList.size();

        },

        toExist   :function () {
            var nodeList = jQuery(this.actual);
            return nodeList.size();
        },

        toHaveAttr:function (attributeName, expectedAttributeValue) {
            var nodeList = jQuery(this.actual);
            var result = true;

            jQuery.each(nodeList, function (index, item) {
                if (jQuery(item).attr(attributeName) != expectedAttributeValue) {
                    result = false;
                    return false;
                }
            })
            /*for(var i = 0;nodeList[i];i++){
             if(nodeList.item(i).attr(attributeName) != expectedAttributeValue ) {
             result = false;
             break;
             }
             }*/
            return result;

        },

        toHaveProp:function (propertyName, expectedPropertyValue) {
            var nodeList = jQuery(this.actual);
            var result = true;
            jQuery.each(nodeList, function (index, item) {
                if (jQuery(item).prop(propertyName) != expectedPropertyValue) {
                    result = false;
                    return false;
                }
            })
            /*for(var i = 0;nodeList[i];i++){
             if(nodeList.item(i).prop(propertyName) != expectedPropertyValue ) {
             result = false;
             break;
             }
             }*/
            return result;

        },

        toHaveId         :function (id) {
            var nodeList = jQuery(this.actual);
            return nodeList.attr('id') == id;
        },

        toHaveHtml       :function (html) {
            var nodeList = jQuery(this.actual);
            return jQuery.trim(nodeList.html()) == jQuery.trim(html);
        },

        toHaveSameSubTree:function (html) {
            var nodeList = jQuery(this.actual);
            var root = nodeList[0];
            if (!root) {
                return false;
            }



            function serializeHTML(node, arr) {

                if (node.nodeType == '1') {
                    arr.push(node.tagName);
                    var childs = node.childNodes;

                    var tagChilds = [];
                    for (var i = 0; childs[i]; i++) {
                        if (childs[i].nodeType == 1) {
                            tagChilds.push(childs[i]);
                        }
                    }
                    if (tagChilds.length) {
                        arr.push('>');
                    }

                    for (var i = 0; tagChilds[i]; i++) {
                        serializeHTML(tagChilds[i], arr);
                        if (i < tagChilds.length - 1) {
                            arr.push('+');
                        }
                    }
                }
                return;
            }

            var temp = jQuery('<div style="display: none;" id="tempHtmlStructure"></div>');
            temp[0].innerHTML = html;
            jQuery('body').append(temp);
            var expectRecord = [];


            serializeHTML(jQuery('#tempHtmlStructure')[0], expectRecord);
            temp.remove();
            expectRecord.shift();
            var expectStr = expectRecord.join('');
            var actualRecord = [];
            serializeHTML(root, actualRecord);
            actualRecord.shift();
            var actualStr = actualRecord.join("");
            return  actualStr == expectStr;

        },

        toHaveText:function (text) {
            var nodeList = jQuery(this.actual);
            var trimmedText = jQuery.trim(nodeList.text());
            if (text && jQuery.isFunction(text.test)) {
                return text.test(trimmedText);
            } else {
                return trimmedText == text;
            }
        },

        toHaveValue:function (value) {
            var nodeList = jQuery(this.actual);
            var result = true;
            jQuery.each(nodeList, function (index, item) {
                if (jQuery(item).val() !== value) {
                    result = false;
                    return false;
                }
            })


            return result;


        },



        toBeDisabled:function (selector) {
            var nodeList = jQuery(this.actual);
            return nodeList.filter(':disabled').size() == nodeList.size();
        },

        toBeFocused        :function (selector) {
            var nodeList = jQuery(this.actual);


            return true;// nodeList.filter(':focus').size() == nodeList.size();
        },

        toHaveComputedStyle:function (styleProp, expectValue) {

            return jQuery(this.actual).first().css(styleProp) === expectValue;


        },
        toHaveCss:function (styleProp, expectValue) {

            return jQuery(this.actual).first().css(styleProp) === expectValue;


        },

        atPosition         :function (x, y, off, relativeEl) {
            var tempOff = 0.1;
            var absX = Math.abs(x);
            var absY = Math.abs(y);
            var referPosition = {top:0, left:0};
            if (arguments[2] && typeof arguments[2] == 'number') {
                tempOff = arguments[2];
            }

            if (arguments[3] && typeof arguments[3] == 'string') {
                var referEl = jQuery(arguments[3]);
                if (referEl) {
                    referPosition = referEl.offset();
                }


            }
            var nodeList = jQuery(this.actual);
            var actualPosition = nodeList.offset();
            var heightGap = nodeList.outerHeight() * tempOff;
            var widthGap = nodeList.outerWidth() * tempOff;
            return (Math.abs(Math.abs(actualPosition.top - referPosition.top) - absY) < heightGap) && ( Math.abs(Math.abs(actualPosition.left - referPosition.left) - absX) < widthGap);
        },


        willAddChildren    :function (selector, nodeNum) {
            var num = 1;
            var self = this;
            if (arguments.length > 1 && typeof arguments[1] == 'number') {
                num = arguments[1];
            }

            var list = jQuery(selector);
            var before = 0;

            jQuery.each(list, function (index, item) {
                if (jQuery(item).parent(self.actual)) {
                    before++;
                }
            })

            this.record = before;



            this.verify = jasmine.Matchers.matcherFn_('willAddChild', function () {
                var list = jQuery(selector);
                var after = 0;
                var self = this;
                jQuery.each(list, function (index, item) {
                    if (jQuery(item).parent(self.actual)) {
                        after++;
                    }
                })

                return  this.record + num == after;
            });
            return this;
        },
        willAddChild       :function (selector) {
            var num = new Date().getTime() + Math.random();


            var parent = jQuery(this.actual)[0];

            if (jQuery(selector, this.actual)[0]) {
                jQuery(selector, this.actual).first().data("_mark_" + num, true)
            }


            this.verify = jasmine.Matchers.matcherFn_('willAddChild', function () {

                if (!parent && jQuery(this.actual)[0] && jQuery(selector, this.actual)[0])return true;

                return  jQuery(selector, this.actual)[0] && !jQuery(selector).first().data("_mark_" + num);
            });
            return this;
        },
        willRemoveChild    :function (selector) {
            var num = new Date().getTime() + Math.random();

            jQuery(selector, this.actual).data("_mark_" + num, true)


            this.verify = jasmine.Matchers.matcherFn_('willAddChild', function () {
                return  !jQuery(selector, this.actual)[0] || !jQuery(selector, this.actual).first().data("_mark_" + num);
            });
            return this;
        },

        willRemoveChildren:function (selector, nodeNum) {
            var num = 1;
            if (arguments.length > 1 && typeof arguments[1] == 'number') {
                num = arguments[1];
            }


            var list = jQuery(selector);
            var before = 0;
            var self = this;
            jQuery.each(list, function (item) {
                if (jQuery(item).parent(self.actual)) {
                    before++;
                }
            })
            /*for(var i= 0,len=list.length;i<len;i++){
             if(S.DOM.parent(list[i],this.actual) ){
             before++;
             }

             }*/


            this.record = before;


            this.verify = jasmine.Matchers.matcherFn_('willRemoveChild', function () {
                var list = jQuery(selector);
                var after = 0;
                var self = this;
                jQuery.each(list, function (index, item) {
                    if (jQuery(item).parent(self.actual)) {
                        after++;
                    }
                })
                /*for(var i= 0,len=list.length;i<len;i++){
                 if(S.DOM.parent(list[i],this.actual) ){
                 after++;
                 }
                 }*/

                return  this.record - num == after;
            });
            return this;
        },

        willAddAttr        :function (attrName, attrValue) {



            this.verify = jasmine.Matchers.matcherFn_('willAddAttr', function () {

                return  jQuery(this.actual).attr(attrName) === attrValue;
            });
            return this;
        },
        willModifyAttr     :function (attrName, newValue) {



            this.verify = jasmine.Matchers.matcherFn_('willModifyAttr', function () {
                return  jQuery(this.actual).attr(attrName) === newValue;
            });
            return this;
        },
        willHaveAttr       :function (attrName, newValue) {



            this.verify = jasmine.Matchers.matcherFn_('willHaveAttr', function () {
                return  jQuery(this.actual).attr(attrName) === newValue;
            });
            return this;
        },
        willRemoveAttr     :function (attrName) {


            this.record = jQuery(this.actual).attr(attrName);


            this.verify = jasmine.Matchers.matcherFn_('willRemoveAttr', function () {
                return  !jQuery(this.actual).attr(attrName);
            });
            return this;
        },
        willModifyInnerHTML:function (newValue) {
            this.verify = jasmine.Matchers.matcherFn_('willModifyInnerHTML', function () {
                return  jQuery(this.actual).html() === newValue;
            });
            return this;
        }
    };
    this.addMatchers(uiMatchers);


});