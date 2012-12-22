;(function(){

    /**
     * Do.js
     * @constructor
     */
    var Do = function(){
        this.queue = [];
    };

    Do.prototype = {

        /**
         * Add method to queue.
         * @param {Function} fun
         */

        add: function( fun ){

            var self = this;

            var done = function(){
                self.done( task );
            };

            var task = {
                fn: fun,
                done: done
            };

            this.queue.push( task );

            // If `fun` is the only one in the queue, execute it.
            if( this.queue.length == 1 ){
                this.next();
            }
        },

        /**
         * Remove task item from queue.
         * @param {Object} t task object.
         */

        remove: function( t ){

            var task
                ,index;
            for( index = 0; task = this.queue[ index ]; index++ ){
                if( task === t ){

                    // Remove the task.
                    this.queue.splice( index, 1 );
                    break;
                }
            }
        },

        /**
         * Remove the finished task and find get next task to run.
         * @param {Object} t The finished task.
         */

        done: function( t ){
            this.remove( t );
            this.next();
        },

        /**
         * Get the first task of the queue to run.
         */

        next: function(){
            var task = this.queue[ 0 ];
            if( task && typeof task.fn == 'function' ){
                task.fn( task.done );
            }
        }
    };

    /**
     * A factory for Do.
     * @return {Function}
     */

    var NewQueue = function(){
        var newDo = new Do();
        return function(fun){
            newDo.add( fun );
        }
    };

    /**
     * Singleton of `Do`
     * @type {Do}
     */

    var DoInstant = new Do();

    /**
     * Method to wrap `Do.add`
     * @param fun
     * @constructor
     */

    var DoAdd = function(fun){
        DoInstant.add( fun );
    };

    if( typeof module !== 'undefined' && module.exports && typeof require !== 'undefined' ){
        module.exports = DoAdd;
        module.exports.newQueue = NewQueue;
    }
    else {
        this.Do = DoAdd;
        this.Do.newQueue = NewQueue;
    }

})();
