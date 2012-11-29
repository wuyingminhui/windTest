/**
 * 用于脚本执行过程中，全局数据
 * @author neekey <ni184775761@gmail.com>
 * @date 2012.11.29
 */
var _ = require( 'underscore' );
var CONFIG = require( '../config.json' );

var GlobalData = function( data, sys ){

    var self = this;
    try{
        var scriptDone = __done;
    }
    catch( e ){
        scriptDone = function(){};
    }

    if( _.isString( data ) ){
        data = JSON.parse( data );
    }
    else if( !_.isObject( data )){
        data = {};
    }

    if( _.isString( sys ) ){
        sys = JSON.parse( sys );
    }
    else if( !_.isObject( sys )){
        sys = {};
    }

    this.get = function ( attr ) {
        return data[ attr ];
    };
    this.set = function (attr, value) {
        data[ attr ] = value;
    };
    this.data = function ( d ) {
        if( d ){
            data = d;

        }
        return data;
    };

    this.sys = function( key, value ){
        if( arguments.length == 0 ){
            return sys;
        }
        else if( arguments.length == 1 ){
            if( _.isObject( key ) ){
                sys = key;
                return sys;
            }
            else {
                return sys[ key ];
            }
        }
        else {
            sys[ key ] = value;
            return sys;
        }
    };

    this.toJSON = function(){
        return {
            data: this.data(),
            sys: this.sys()
        }
    };


    this.done = function( testResult ){
        console.log( 'before execute done! ' );
        self.sys( 'testResult', testResult );
        scriptDone( self.toJSON() );
    };
};

GlobalData.prototype.toScriptString = function( data, sys ){

    var dataString = JSON.stringify( data || this.toJSON() );
    var sysString = JSON.stringify( sys || this.sys() );
    return 'var ' + CONFIG.GLOBAL_NAMESPACE + '= (new ' + GlobalData.toString() +')(' + dataString + ', ' + sysString + ')';
};

GlobalData.prototype.retrieve = function( data, sys ){

    this.data( data );
    this.sys( sys );
};

module.exports = GlobalData;


