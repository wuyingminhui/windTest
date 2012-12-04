/**
 * 脚本解析模块
 */
module.exports = {
    parse: function( str ){
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
    }
};