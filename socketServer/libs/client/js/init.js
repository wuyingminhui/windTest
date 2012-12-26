/**
 * 用于测试环境的初始化
 * @author neekey
 * @date 12-12-5
 */

function init(){

    // 初始化数据对象
    // 将server的全局数据同步的client，
    // 这份数据中包含了session数据，pageId，parentPageId等信息
    WinTest.Data.init( S_DATA );

    // 初始化会话
//    WinTest.Session.init();

    // 初始化连接
    // 关联上session，pageId等信息
    // 通信
    WinTest.MsgManager.connect();

    // commit test
}
