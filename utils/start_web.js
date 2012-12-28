var ChildProcess = require( 'child_process' );

module.exports = function (url) {
    switch (process.platform) {
        case 'win32':
            ChildProcess.exec('start ' + url);
            break;
        case 'darwin':
            ChildProcess.exec('open ' + url);
            break;
        case 'linux':
            ChildProcess.exec('open ' + url);
            break;
        default:
            console.log('please open %s in your browser', url);
    }
};