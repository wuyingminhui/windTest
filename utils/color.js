/**
 * 用于在控制台中控制颜色输出
 */

/**
 * Colors Cheat-sheet
 *     white  : "\033[1;37m",   black        : "\033[0;30m",
 *     red    : "\033[0;31m",   light_red    : "\033[1;31m",
 *     green  : "\033[0;32m",   light_green  : "\033[1;32m",
 *     yellow : "\033[0;33m",   light_yellow : "\033[1;33m",
 *     blue   : "\033[0;34m",   light_blue   : "\033[1;34m",
 *     purple : "\033[0;35m",   light_purple : "\033[1;35m",
 *     cyan   : "\033[0;36m",   light_cyan   : "\033[1;36m",
 *     gray   : "\033[1;30m",   light_gray   : "\033[0;37m",
 *     reset  : "\033[0m"
 */

var COLOR = {

    white: "\033[1;37m",    black: "\033[0;30m",
    red: "\033[0;31m",      light_red: "\033[1;31m",
    green: "\033[0;32m",    light_green: "\033[1;32m",
    yellow: "\033[0;33m",   light_yellow: "\033[1;33m",
    blue: "\033[0;34m",     light_blue: "\033[1;34m",
    purple: "\033[0;35m",   light_purple: "\033[1;35m",
    cyan: "\033[0;36m",     light_cyan: "\033[1;36m",
    gray: "\033[1;30m",     light_gray: "\033[0;37m",
    reset: "\033[0m"
};

module.exports.color = function( text, color ){

    return COLOR[ color ] + text + COLOR[ 'reset' ];
};