/**
 * 工具集合
 */
var FS = require('fs');
var spawn = require('child_process').spawn;
var Mustache = require('mustache');
var assert = require('assert');


var _ = require('underscore');
var NEW_LINE = '\r\n';

module.exports = {

    addFileToString:function (str, file, mode) {

        mode = mode || 'append';
        var fileStr = FS.readFileSync(file, 'utf-8').toString();
        var result;

        switch (mode) {
            case 'append':
                result = str + NEW_LINE + fileStr;
                break;
            case 'prepend':
                result = fileStr + NEW_LINE + str;
                break;
            default:
                result = str;
                break;
        }

        return result;
    },

    addFilesToString:function (str, files, mode) {

        var self = this;
        var result = str;

        if (!_.isArray(files)) {
            files = [ files ];
        }

        files.forEach(function (file) {
            result = self.addFileToString(result, file, mode);
        });

        return result;
    },


    scriptExec:function (exeData, client, __Jas, index) {
        var execScriptTPL = FS.readFileSync(__dirname + '/script_wrap.mustache', 'utf-8')
            .replace(/'{{/g, '{{')
            .replace(/}}'/g, '}}');
        var libraryArray = [ __dirname + '/libs/jasmine-min.js', __dirname + '/libs/jasmine-jsreporter-min.js' ];
        var libraryStr = this.addFilesToString('', libraryArray);

        index = typeof index == 'undefined' ? 0 : index;
        if (index == exeData.length) {
            client.end(function () {
                FS.writeFileSync('./testResult.json', JSON.stringify(__Jas.testResult));
            });
            return;
        }

        var exe = exeData[ index ];
        var url = exe.url;
        var str = exe.str;
        var data = JSON.stringify(__Jas.data.toJSON());
        var execScript = Mustache.render(execScriptTPL, {
            dataStr:data,
            librarys:libraryStr,
            userScript:str
        });

        client.protocol.url(url);
        client.protocol.executeAsync(execScript, function (response) {

            var Jas = response.value.__Jas;
            __Jas.data._data = Jas.data;
            __Jas.testResult.push(Jas.testResult);

            module.exports.scriptExec(exeData, client, __Jas, index + 1);
        });
    },

    parser:function (str) {
        var chunks = str.split(/\/\/#url\s+(.*)[\r\n]/g).splice(1);
        var ifUrl = true;
        var result = [];
        var item;

        chunks.forEach(function (chunk) {
            if (ifUrl) {
                item = { url:chunk };
                ifUrl = false;
            }
            else {
                item.str = chunk;
                result.push(item);
                ifUrl = true;
            }
        });

        return result;
    },

    /**
     * 执行操作系统命令
     * @param command
     */
    exec:function (command, callbak) {

        var cmd = spawn("cmd", command);

        cmd.stdout.setEncoding("ASCII");
        cmd.stdout.on("data", function (data) {
            console.log("------------------------------");
            console.log("stdout:" + data);
            callbak && callbak({type:'INFO', data:data.toString()}, cmd );
        });

        cmd.stderr.on("data", function (data) {
            console.log("------------------------------");
            console.log("stderr:" + data);
            console.log("------------------------------");
            callbak && callbak({type:'ERROR', data:data.toString()}, cmd );
        });

        cmd.on("exit", function (code) {
            console.log("exited with code:" + code);
            console.log("------------------------------");
            callbak && callbak({type:'END', data:code.toString()}, cmd );
        });
    }
};