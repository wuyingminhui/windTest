/**
 * 市场判定——今日任务，任务列表.
 * @author yinruo <yinruo.nyj@taobao.com>
 * @date 12-11-20
 */
KISSY.add(function( S, Template, Config, TaskDetailClass, Mask, ResultMask ){

    var getTaskListAPI = Config.API.getTaskList;
    var taskListHook = '.J_TaskList';
    // 任务详情容器钩子
    var taskDetailHook = '.J_TaskDetail';
    var taskListTPLHook = '.J_TaskListTPL';
    var getNewTaskTriggerHook = '.J_GetNewTaskTrigger';
    var getTaskDetailTriggerHook = '.J_GetTaskDetailTrigger';
    var taskIdAttr = 'data-id';
    var getTaskListErrorMsg = '获取任务列表失败，请刷新页面重试（=。=!';
    var judgeBtnCls = 'judge-btn-red';
    var checkBtnCls = 'judge-btn-grey';
    var checkBtnText = '查看';

    return {
        init: function(){

            this.TaskDetail = new TaskDetailClass( taskDetailHook );

            this.TPL = Template(S.one( taskListTPLHook).html().replace( /@/g, '#'));
            this.taskList = S.one( taskListHook );

            // 当节点存在时才请求数据（不在的话可能说明所有任务都已经完成，或者申请失败之类的）
            if( this.taskList ){
                this.attach();
                this.data = {
                    // 当前为第几页
                    pageNum: 0,
                    // 当前的5个任务的id数组
                    curTaskIdList: [],
                    // 当前展开着的任务索引值(0-4), undefined表明没有任务被展开
                    curTaskIndex: undefined
                };
                this.fetch();
            }
        },

        /**
         * 绑定事件
         */
        attach: function(){

            var self = this;

            // 点击详情
            this.taskList.delegate( 'click', getTaskDetailTriggerHook, function( event ){
                var current = S.one( event.currentTarget );
                var taskId = current.attr( taskIdAttr );
                self.showTaskDetail( taskId );
            });

            // 点击换一组
            this.taskList.delegate( 'click', getNewTaskTriggerHook, function( event ){
                self.fetch();
            });

            // 当请求详情开始时
            this.TaskDetail.on( 'beginFetch', function(){
                Mask.show();
            });

            // 当请求结束
            this.TaskDetail.on( 'afterFetch', function(){
                Mask.hide();
            });

            // 用户进行判定后讲对应的item的trigger更新为‘查看’
            this.TaskDetail.on( 'judge', function( data ){
                var taskId = data.taskId;
                self.updateTrigger( self.getTriggerById( taskId ) );
            });

            // 当任务详情被关闭
            this.TaskDetail.on( 'close', function( data ){
                // 设置当前任务详情为undefined
                self.data.curTaskIndex = undefined;
                if( data.ifFinished ){
                    self.showFinishedTip();
                }
            });

            // 下一任务
            this.TaskDetail.on( 'next', function( data ){
                // 若今日任务已经做完，则不再发送请求
                if( data.ifFinished ){
                    self.showFinishedTip();
                    return;
                }

                var taskId = data.taskId;
                var index = self.getIndexById( taskId );
                var nextIndex = index + 1;
                var nextTaskId = self.data.curTaskIdList[ nextIndex ];

                // 如果下一任务在当前列表中
                if( nextTaskId ){
                    self.showTaskDetail( nextTaskId );
                }
                // 否则，先请求下一页的任务列表
                else {
                    self.fetch(function(){
                        // 然后，显示下一列表的第一个任务
                        self.showTaskDetail( self.data.curTaskIdList[0] );
                    }, false );
                }
            });
        },

        /**
         * 抓取任务列表数据
         * @param {Function} next
         * @param {Boolean} ifMask 是否在请求时显示mask，默认展示
         */
        fetch: function( next, ifMask ){

            var self = this;

            // 显示loading
            ifMask !== false && Mask.show();

            S.IO({
                type:"get",
                url: getTaskListAPI,
                data: {},
                dataType: 'json',
                success: function( response ){
                    // 隐藏loading
                    Mask.hide( function(){

                        if( response && response.success && response.result ){

                            // 保存数据
                            self.updateData( response.result );
                            // 渲染列表
                            self.render( response.result );
                            // 若有回调则执行
                            typeof next == 'function' && next( response.result );
                        }
                        else {
                            var msg = response.msg || getTaskListErrorMsg;
                            alert( msg );
                        }
                    });
                },
                error: function( response, statusText, xhr ){
                    S.log( '请求任务详情失败：' + statusText );
                    alert( getTaskListErrorMsg );
                    Mask.hide();
                }
            });
        },

        showTaskDetail: function( id ){
            // 设置当前的任务详情id
            this.data.curTaskIndex = this.getIndexById( id );
            // 获取详情
            this.TaskDetail.update( id );
        },

        /**
         * 保存和处理fetch过来的数据
         * @param result
         */
        updateData: function( result ){
            var self = this;
            this.data = {
                curTaskIdList: [],
                pageNum: result.pageNum,
                curTaskIndex: undefined
            };

            S.each( result.taskList, function( task ){
                self.data.curTaskIdList.push( task.id );
            });
        },

        /**
         * 渲染列表
         * @param data
         */
        render: function( data ){
            var HTML = this.TPL.render( data );
            // 若木有任务可以推荐
            if( data.taskList && data.taskList.length == 0 ){
                ResultMask.show( 'noTask' );
            }
            else {
                this.taskList.html( HTML );
            }

        },

        /**
         * 根据任务id获取列表中对应的trigger节点
         * @param id
         * @return {*}
         */
        getTriggerById: function( id ){

            var trigger = undefined;
            this.taskList.all( getTaskDetailTriggerHook).each(function( t ){
                t = S.one( t );
                if( t.attr( taskIdAttr ) == id ){
                    trigger = t;
                }
            });

            return trigger;
        },

        /**
         * 根据任务id获取列表中对应的trigger的序号
         * @return {*}
         */
        getIndexById: function( id ){

            var index = undefined;
            this.taskList.all( getTaskDetailTriggerHook).each(function( t, i ){
                t = S.one( t );
                if( t.attr( taskIdAttr ) == id ){
                    index = i;
                }
            });

            return index;
        },

        /**
         * 显示已经完成今日任务的mask
         */
        showFinishedTip: function(){
            ResultMask.show( 'finished' );
        },

        /**
         * 更新任务项中的按钮状态，更新为"查看"
         * @param trigger
         */
        updateTrigger: function( trigger ){
            trigger = S.one( trigger );
            trigger.removeClass( judgeBtnCls );
            trigger.addClass( checkBtnCls );
            trigger.text( checkBtnText );
        }
    }

}, { requires: [
    'template',
    '../common/config',
    '../common/task_detail',
    './loading_mask',
    './result_mask'
]});