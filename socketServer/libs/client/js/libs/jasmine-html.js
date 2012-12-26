jasmine.HtmlReporterHelpers = {};

jasmine.HtmlReporterHelpers.createDom = function (type, attrs, childrenVarArgs) {
    var el = document.createElement(type);

    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];

        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else {
            if (child) {
                el.appendChild(child);
            }
        }
    }

    for (var attr in attrs) {
        if (attr == "className") {
            el[attr] = attrs[attr];
        } else {
            el.setAttribute(attr, attrs[attr]);
        }
    }

    return el;
};

jasmine.HtmlReporterHelpers.getSpecStatus = function (child) {
    var results = child.results();
    var status = results.passed() ? 'passed' : 'failed';
    if (results.skipped) {
        status = 'skipped';
    }

    return status;
};

jasmine.HtmlReporterHelpers.appendToSummary = function (child, childElement) {
    var parentDiv = this.dom.summary;
    var parentSuite = (typeof child.parentSuite == 'undefined') ? 'suite' : 'parentSuite';
    var parent = child[parentSuite];

    if (parent) {
        if (typeof this.views.suites[parent.id] == 'undefined') {
            this.views.suites[parent.id] = new jasmine.HtmlReporter.SuiteView(parent, this.dom, this.views);
        }
        parentDiv = this.views.suites[parent.id].element;
    }

    parentDiv.appendChild(childElement);
};


jasmine.HtmlReporterHelpers.addHelpers = function (ctor) {
    for (var fn in jasmine.HtmlReporterHelpers) {
        ctor.prototype[fn] = jasmine.HtmlReporterHelpers[fn];
    }
};

jasmine.HtmlReporter = function (_doc) {
    var self = this;
    var doc = _doc || window.document;

    var reporterView;

    var dom = {};

    // Jasmine Reporter Public Interface
    self.logRunningSpecs = false;

    self.reportRunnerStarting = function (runner) {
        var specs = runner.specs() || [];

        if (specs.length == 0) {
            return;
        }

        createReporterDom(runner.env.versionString());
        doc.body.appendChild(dom.reporter);

        reporterView = new jasmine.HtmlReporter.ReporterView(dom);
        reporterView.addSpecs(specs, self.specFilter);
    };

    self.reportRunnerResults = function (runner) {

        reporterView && reporterView.complete();
    };

    self.reportSuiteResults = function (suite) {
        reporterView.suiteComplete(suite);
    };

    self.reportSpecStarting = function (spec) {
        if (self.logRunningSpecs) {
            self.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
        }
    };

    self.reportSpecResults = function (spec) {
        reporterView.specComplete(spec);
    };

    self.log = function () {
        var console = jasmine.getGlobal().console;
        if (console && console.log) {
            if (console.log.apply) {
                console.log.apply(console, arguments);
            } else {
                console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
            }
        }
    };

    self.specFilter = function (spec) {
        if (!focusedSpecName()) {
            return true;
        }

        return spec.getFullName().indexOf(focusedSpecName()) === 0;
    };

    return self;

    function focusedSpecName() {
        var specName;

        (function memoizeFocusedSpec() {
            if (specName) {
                return;
            }

            var paramMap = [];
            var params = doc.location.search.substring(1).split('&');

            for (var i = 0; i < params.length; i++) {
                var p = params[i].split('=');
                paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
            }

            specName = paramMap.spec;
        })();

        return specName;
    }

    function createReporterDom(version) {
        dom.reporter = self.createDom('div', { id:'HTMLReporter', className:'jasmine_reporter' },
            dom.banner = self.createDom('div', { className:'banner' },
                self.createDom('span', { className:'title' }, "Jasmine "),
                self.createDom('span', { className:'version' }, version)),

            dom.symbolSummary = self.createDom('ul', {className:'symbolSummary'}),
            dom.alert = self.createDom('div', {className:'alert'}),
            dom.results = self.createDom('div', {className:'results'},
                dom.summary = self.createDom('div', { className:'summary' }),
                dom.details = self.createDom('div', { id:'details' }))
        );
    }
};
jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter);

jasmine.HtmlReporter.ReporterView = function (dom) {
    this.startedAt = new Date();
    this.runningSpecCount = 0;
    this.completeSpecCount = 0;
    this.passedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;

    this.createResultsMenu = function () {
        this.resultsMenu = this.createDom('span', {className:'resultsMenu bar'},
            this.summaryMenuItem = this.createDom('a', {className:'summaryMenuItem', href:"#"}, '0 specs'),
            ' | ',
            this.detailsMenuItem = this.createDom('a', {className:'detailsMenuItem', href:"#"}, '0 failing'));

        this.summaryMenuItem.onclick = function () {
            dom.reporter.className = dom.reporter.className.replace(/ showDetails/g, '');
        };

        this.detailsMenuItem.onclick = function () {
            showDetails();
        };
    };

    this.addSpecs = function (specs, specFilter) {
        this.totalSpecCount = specs.length;

        this.views = {
            specs :{},
            suites:{}
        };

        for (var i = 0; i < specs.length; i++) {
            var spec = specs[i];

            this.views.specs[spec.id] = new jasmine.HtmlReporter.SpecView(spec, dom, this.views);
            if (specFilter(spec)) {
                this.runningSpecCount++;
            }
        }
    };

    this.specComplete = function (spec) {

        this.completeSpecCount++;

        if (isUndefined(this.views.specs[spec.id])) {
            this.views.specs[spec.id] = new jasmine.HtmlReporter.SpecView(spec, dom);
        }

        var specView = this.views.specs[spec.id];


        switch (specView.status()) {
            case 'passed':
                this.passedCount++;
                break;

            case 'failed':
                this.failedCount++;
                break;

            case 'skipped':
                this.skippedCount++;
                break;
        }

        specView.refresh();
        this.refresh();
    };

    this.suiteComplete = function (suite) {
        var suiteView = this.views.suites[suite.id];
        if (isUndefined(suiteView)) {
            return;
        }
        suiteView.refresh();
    };

    this.refresh = function () {

        if (isUndefined(this.resultsMenu)) {
            this.createResultsMenu();
        }

        // currently running UI
        if (isUndefined(this.runningAlert)) {
            this.runningAlert = this.createDom('a', {href:"?", className:"runningAlert bar"});
            dom.alert.appendChild(this.runningAlert);
        }
        this.runningAlert.innerHTML = "Running " + this.completeSpecCount + " of " + specPluralizedFor(this.totalSpecCount);

        // skipped specs UI
        if (isUndefined(this.skippedAlert)) {
            this.skippedAlert = this.createDom('a', {href:"?", className:"skippedAlert bar"});
        }

        this.skippedAlert.innerHTML = "Skipping " + this.skippedCount + " of " + specPluralizedFor(this.totalSpecCount) + " - run all";

        if (this.skippedCount === 1 && isDefined(dom.alert)) {
            dom.alert.appendChild(this.skippedAlert);
        }

        // passing specs UI
        if (isUndefined(this.passedAlert)) {
            this.passedAlert = this.createDom('span', {href:"?", className:"passingAlert bar"});
        }
        this.passedAlert.innerHTML = "Passing " + specPluralizedFor(this.passedCount);

        // failing specs UI
        if (isUndefined(this.failedAlert)) {
            this.failedAlert = this.createDom('span', {href:"?", className:"failingAlert bar"});
        }
        this.failedAlert.innerHTML = "Failing " + specPluralizedFor(this.failedCount);

        if (this.failedCount === 1 && isDefined(dom.alert)) {
            dom.alert.appendChild(this.failedAlert);
            dom.alert.appendChild(this.resultsMenu);
        }

        // summary info
        this.summaryMenuItem.innerHTML = "" + specPluralizedFor(this.runningSpecCount);
        this.detailsMenuItem.innerHTML = "" + this.failedCount + " failing";
    };

    this.complete = function () {
        dom.alert.removeChild(this.runningAlert);

        this.skippedAlert.innerHTML = "Ran " + this.runningSpecCount + " of " + specPluralizedFor(this.totalSpecCount) + " - run all";

        if (this.failedCount === 0) {
            dom.alert.appendChild(this.createDom('span', {className:'passingAlert bar'}, "Passing " + specPluralizedFor(this.passedCount)));
        } else {
            showDetails();
        }

        dom.banner.appendChild(this.createDom('span', {className:'duration'}, "finished in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s"));
    };

    return this;

    function showDetails() {
        if (dom.reporter.className.search(/showDetails/) === -1) {
            dom.reporter.className += " showDetails";
        }
    }

    function isUndefined(obj) {
        return typeof obj === 'undefined';
    }

    function isDefined(obj) {
        return !isUndefined(obj);
    }

    function specPluralizedFor(count) {
        var str = count + " spec";
        if (count > 1) {
            str += "s"
        }
        return str;
    }

};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.ReporterView);


jasmine.HtmlReporter.SpecView = function (spec, dom, views) {
    this.spec = spec;
    this.dom = dom;
    this.views = views;

    this.symbol = this.createDom('li', { className:'pending' });
    this.dom.symbolSummary.appendChild(this.symbol);

    this.summary = this.createDom('div', { className:'specSummary' },
        this.createDom('a', {
            className:'description',
            href     :'?spec=' + encodeURIComponent(this.spec.getFullName()),
            title    :this.spec.getFullName()
        }, this.spec.description)
    );

    this.detail = this.createDom('div', { className:'specDetail' },
        this.createDom('a', {
            className:'description',
            href     :'?spec=' + encodeURIComponent(this.spec.getFullName()),
            title    :this.spec.getFullName()
        }, this.spec.getFullName())
    );
};

jasmine.HtmlReporter.SpecView.prototype.status = function () {
    return this.getSpecStatus(this.spec);
};

jasmine.HtmlReporter.SpecView.prototype.refresh = function () {
    this.symbol.className = this.status();

    switch (this.status()) {
        case 'skipped':
            break;

        case 'passed':
            this.appendSummaryToSuiteDiv();
            break;

        case 'failed':
            this.appendSummaryToSuiteDiv();
            this.appendFailureDetail();
            break;
    }
};

jasmine.HtmlReporter.SpecView.prototype.appendSummaryToSuiteDiv = function () {
    this.summary.className += ' ' + this.status();
    this.appendToSummary(this.spec, this.summary);
};

jasmine.HtmlReporter.SpecView.prototype.appendFailureDetail = function () {
    this.detail.className += ' ' + this.status();

    var resultItems = this.spec.results().getItems();
    var messagesDiv = this.createDom('div', { className:'messages' });

    for (var i = 0; i < resultItems.length; i++) {
        var result = resultItems[i];

        if (result.type == 'log') {
            messagesDiv.appendChild(this.createDom('div', {className:'resultMessage log'}, result.toString()));
        } else if (result.type == 'expect' && result.passed && !result.passed()) {
            messagesDiv.appendChild(this.createDom('div', {className:'resultMessage fail'}, result.message));

            if (result.trace.stack) {
                messagesDiv.appendChild(this.createDom('div', {className:'stackTrace'}, result.trace.stack));
            }
        }
    }

    if (messagesDiv.childNodes.length > 0) {
        this.detail.appendChild(messagesDiv);
        this.dom.details.appendChild(this.detail);
    }
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SpecView);
jasmine.HtmlReporter.SuiteView = function (suite, dom, views) {
    this.suite = suite;
    this.dom = dom;
    this.views = views;

    this.element = this.createDom('div', { className:'suite' },
        this.createDom('a', { className:'description', href:'?spec=' + encodeURIComponent(this.suite.getFullName()) }, this.suite.description)
    );

    this.appendToSummary(this.suite, this.element);
};

jasmine.HtmlReporter.SuiteView.prototype.status = function () {
    return this.getSpecStatus(this.suite);
};

jasmine.HtmlReporter.SuiteView.prototype.refresh = function () {
    this.element.className += " " + this.status();
};

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter.SuiteView);


jasmine.JsonReporter = function (callback) {
    var self = this;
    var toJSON = function (runner) {
        var runnerJSON = {spies_:[]};
        var specs = runner.specs();

        for (var i = 0; i < specs.length; i++) {
            var results = specs[i].results_;
            var suite = {
                id         :specs[i].suite.id,
                description:specs[i].suite.description,
                finished   :specs[i].suite.finished
            };
            var specJSON = {
                description:specs[i].description,
                id         :specs[i].id,
                suite      :suite,
                results_   :[]
            }


            var items = results.items_;
            var result = {
                description:results.description,
                items_     :[],
                failedCount:results.failedCount,
                passedCount:results.passedCount,
                skipped    :results.skipped,
                totalCount :results.totalCount
            }

            for (var k = 0; k < items.length; k++) {
                var item = {
                    actual     :jasmine.pp(items[k].actual),
                    expected   :jasmine.pp(items[k].expected||''),
                    matcherName:items[k].matcherName,
                    message    :items[k].message,
                    passed_    :items[k].passed_,
                    type       :items[k].type
                }
                if (items[k].trace) {
                    item.trace = {
                        stack:jasmine.pp(items[k].trace.stack),
                        type :items[k].trace.type
                    }
                }

                result.items_.push(item);
            }

            specJSON.results_.push(result);


            runnerJSON.spies_.push(specJSON);
        }

        return runnerJSON;


    }

    self.reportRunnerStarting = function (runner) {

    };

    self.reportRunnerResults = function (runner) {
        // 1. 首先遍历一遍 确定suites和spec的关系
        var jsonOject = toJSON(runner);
        var specs = jsonOject['spies_'];
        var suites = [];

        var specsFailedCount = 0;
        for (var i = 0, len = specs.length; i < len; ++i) {
            var key = specs[i]['suite'].id;
            if (!suites[key]) {
                suites[key] = {};
                suites[key].id = key;
                suites[key].description = specs[i]['suite'].description;
                suites[key].finished = specs[i]['suite'].finished;
                suites[key].specs = [];
            }

            delete specs[i].suite;
            suites[key].specs.push(specs[i]);


            if (specs[i]['results_'][0].failedCount) {
                specsFailedCount++;
                specs[i].failed = true;
            }

        }
        var resultJSON = {'totalSpecs':len, 'failedSpecs':specsFailedCount, 'suites':suites};



        self.jsonResult = resultJSON;

        callback && callback(self.jsonResult);
       

    };

    self.reportSuiteResults = function (suite) {

    };

    self.reportSpecStarting = function (spec) {

    };

    self.reportSpecResults = function (spec) {

    };
    self.renderHTML = function (resultJSON,el) {


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

        return  jQuery.tmpl(template,resultJSON).appendTo(el);


    }


    return self;
}

jasmine.HtmlReporterHelpers.addHelpers(jasmine.HtmlReporter);