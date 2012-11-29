/**
 * 工具集合
 */
var FS = require('fs');
var spawn = require('child_process').spawn;
var Mustache = require('mustache');
var assert = require('assert');
var GlobalData = require( './global_data' );

var _ = require('underscore');
var NEW_LINE = '\r\n';

module.exports = {

    /**
     * 合并一个文件和字符串
     * @param str
     * @param file
     * @param mode append|prepend
     * @return {String}
     */
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

    /**
     * 合并一个文件列表到字符串
     * @param str
     * @param files
     * @param mode
     * @return {String}
     */
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

    /**
     * 执行脚本
     * @param {Object} obj.exeData
     * @param {WebdriverNode} obj.client
     * @param {GlobalData} [obj.globalData]
     * @param {Number} [obj.index]
     * @param {Function} obj.next
     * @param {Array} [obj.libs]
     */
    scriptExec: function ( obj ) {

        var exeData = obj.exeData;
        var client = obj.client;
        var globalData = obj.globalData || new GlobalData;
        var index = typeof obj.index == 'undefined' ? 0 : obj.index;
        var next = obj.next;
        var libs = obj.libs;

        // 获取脚本模板TPL
        var execScriptTPL = FS.readFileSync( __dirname + '/script_wrap.mustache', 'utf-8' )
            .replace( /'{{/g, '{{' )
            .replace( /}}'/g, '}}' );
        // 构造依赖的脚本
        var libraryStr = this.addFilesToString( '', libs, 'append' );

        // 如果已经执行完所有的chunk了，则说明脚本执行完毕了
        // 结束session并将测试的结果返回
        if (index == exeData.length) {
            client.end(function(){
                // 讲结果写入的一个文件中 todo 仅供测试，之后删掉
                FS.writeFileSync('./testResult.json', globalData.sys( 'testResult' ) );
                next( { testResult: globalData.sys( 'testResult' ) } );
            });
            return;
        }

        // 需要执行的脚本chunk
        var exe = exeData[ index ];
        // 需要前往的页面地址
        var url = exe.url;
        // 需要执行的脚本字符串
        var str = exe.str;
        // 用于设置全局对象的字符串
        var globalDataString = globalData.toScriptString();
        // 最终构造出来的运行脚本
        var execScript = Mustache.render(execScriptTPL, {
            globalData: globalDataString,
            libs: libraryStr,
            userScript: str
        });

        // 打开制定的页面
        client.protocol.url( url );
        // 执行脚本
        client.protocol.executeAsync( execScript, function ( response ) {

            var responseData = response.value;
            globalData.retrieve( responseData.data, responseData.sys );

            module.exports.scriptExec({
                exeData: exeData,
                client: client,
                globalData: globalData,
                index: index + 1,
                next: next,
                libs: libs
            });
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
     * @param {String} command
     * @param {Function} callback
     */
    exec:function (command, callback) {

        var cmd = spawn("cmd", command);

        cmd.stdout.setEncoding("ASCII");
        cmd.stdout.on("data", function (data) {
            console.log("------------------------------");
            console.log("stdout:" + data);
            callback && callback({type:'INFO', data:data.toString()}, cmd );
        });

        cmd.stderr.on("data", function (data) {
            console.log("------------------------------");
            console.log("stderr:" + data);
            console.log("------------------------------");
            callback && callback({type:'ERROR', data:data.toString()}, cmd );
        });

        cmd.on("exit", function (code) {
            console.log("exited with code:" + code);
            console.log("------------------------------");
            callback && callback({type:'END', data:code.toString()}, cmd );
        });
    }
};