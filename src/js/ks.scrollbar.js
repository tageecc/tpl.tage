/**
 * @description    : 滚动条组件 ue.scrollbar
 * @author         : chenxizhong@4399.net
 * @change details : 2012-12-22 created by czonechan
 * @change details : 2013-01-26 update by czonechan 将原本基于滚动条按钮位置来计算容器滚动距离修改为按照容器滚动距离来计算滚动条按钮位置
 * @change details : 2013-01-26 update by czonechan reset 方法新增 animate speed 两个参数用于开启重置滚动条时动画效果
 * @change details : 2013-01-26 update by czonechan boxScrollTo 和 scrollTo 新增 silent, isstop, callback 三个参数
 * @parameter      :
 * @details        : api http://t2.s.img4399.com/base/js/plugins/ue.scrollbar/ hostip 192.168.51.203
 */
;(function(factory) {
    // CMD/SeaJS
    if(typeof define === "function") {
        define(factory);
    }
    // No module loader
    else {
        factory('', window['ue'] = window['ue'] || {}, '');
    }

}(function(require, exports, module) {

    var isMouseDown = false;

    /*获取鼠标位置*/
    function getMousePosition(e){
        var posY = 0, posX = 0;

        if(e.type == "touchstart" || e.type == "touchend" || e.type == "touchmove"){
            posX = e.originalEvent.changedTouches[0].clientX;
            posY = e.originalEvent.changedTouches[0].clientY;
        } else {
            if (e.pageY) {
                posY = e.pageY;
                posX = e.pageX;
            }else if (e.clientY ) {
                posY = e.clientY + document.body.scrollTop || document.documentElement.scrollTop;
                posX = e.clientX + document.body.scrollLeft || document.documentElement.scrollLeft;
            }
        }
        return {
            x : posX,
            y : posY
        }
    }

    function fixMousewheel(e){
        var delta = 0, deltaX = 0, deltaY = 0
        // Old school scrollwheel delta
        if ( e.wheelDelta ) { delta = e.wheelDelta/120; }
        if ( e.detail     ) { delta = -e.detail/3; }

        // New school multidimensional scroll (touchpads) deltas
        deltaY = delta;

        // Gecko
        if ( e.axis !== undefined && e.axis === e.HORIZONTAL_AXIS ) {
            deltaY = 0;
            deltaX = -1 * delta;
        }

        // Webkit
        if ( e.wheelDeltaY !== undefined ) { deltaY = e.wheelDeltaY / 120; }
        if ( e.wheelDeltaX !== undefined ) { deltaX = -1*e.wheelDeltaX / 120; }

        return {delta : delta, deltaX : deltaX, deltaY : deltaY}
    }

    function ctor(options){
        if(this.constructor !== ctor){
            return new ctor(options);
        }

        var defaults = {
            height : 0,
            scroll_per : 20,//每次滚动滑轮，容器移动10像素
            min_scroll_size : 30,
            scrollbarbg : $(),
            target : $(),
            box : $(),
            scrollbar : $(),
            btn : $(),
            onscroll : function(){},
            btn_prev : $(),
            btn_next : $()
        };

        this.options = options = $.extend(defaults, options);

        if(typeof options.height === "number" && options.height > 0){
            this.type = 1;
            this.size = options.height;
        } else if (typeof options.width === "number" && options.width > 0){
            this.type = 0;
            this.size = options.width;
        } else {
            return;
        }

        this.lastMousePos = 0;
        this.lastElemOffset = 0;
        this.btn_pos = 0;
        this.box_scroll_pos = 0;

        this.init();
    }

    ctor.prototype = {
        constructor : ctor,

        init : function(){
            var _this = this,
                options = this.options;

            this.reset();

            options.btn.unbind("mousedown.scrollbar touchstart.scrollbar").bind("mousedown.scrollbar touchstart.scrollbar",function(e){
                _this.isMouseDown = true;
                if (_this.type == 1){
                    _this.lastMousePos = getMousePosition(e).y;
                    _this.lastElemOffset = this.offsetTop || 0;
                } else {
                    _this.lastMousePos = getMousePosition(e).x;
                    _this.lastElemOffset = this.offsetLeft || 0;
                }

                _this.updatePosition(e);
                document.body.onselectstart = function(){return false};
                return false;
            });

            //todos 鼠标滚动条背景按下 滚动逐步移动到按下的位置
            options.scrollbarbg.unbind("click.scrollbar").bind("click.scrollbar", function(e){
                var offset = _this.type ? e.offsetY : e.offsetX;
                var percent = offset / _this.scrollbar_size;
                var pos = percent * _this.real_box_size;

                _this.boxScrollTo(pos, true);

            });

            options.btn_prev.attr("data-direction", "prev");
            options.btn_next.attr("data-direction", "next");

            options.btn_prev.add(options.btn_next).unbind("click.scrollbar").bind("click.scrollbar", function(e){
                var direction = ($(this).attr("data-direction") === "prev") ? -1 : 1,
                    pos = _this.box_scroll_pos  + direction *  _this.scroll_per;

                if (pos > _this.real_box_size){
                    pos = _this.real_box_size;
                }

                if (pos < 0){
                    pos = 0;
                }

                _this.boxScrollTo(pos, true, 0, true, true);

                e.preventDefault();
            });

            $([window,document.body]).bind("mouseup.scrollbar touchend.scrollbar", function(){
                if(_this.isMouseDown){
                    _this.isMouseDown = false;
                    document.body.onselectstart = function(){return true};
                    return false;
                }
            }).bind("mousemove.scrollbar touchmove.scrollbar", function(e){
                if(_this.isMouseDown){
                    _this.updatePosition(e);
                    return false;
                }
            });

            this.last_wheel_time = new Date();

            if(this.type == 1){
                options.target.unbind("mousewheel.scrollbar DOMMouseScroll.scrollbar").bind("mousewheel.scrollbar DOMMouseScroll.scrollbar", function(e){
                    var evt = fixMousewheel(e.originalEvent || e),
                        pos = _this.box_scroll_pos  - evt.delta * _this.scroll_per;

                    if((_this.box_scroll_pos == 0 && evt.delta == 1) || ((_this.box_scroll_pos == _this.real_box_size || _this.real_box_size <= 0)  && evt.delta == -1)){
                        return true;
                    }

                    if (pos > _this.real_box_size){
                        pos = _this.real_box_size;
                    }

                    if (pos < 0){
                        pos = 0;
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    if (new Date() - _this.last_wheel_time < 200){
                        return false;
                    }

                    _this.last_wheel_time = new Date();
                    _this.boxScrollTo(pos, true);
                });
            }
        },

        reset : function(animate, speed){
            var _this = this,
                animate = animate === true ? true :  false,
                speed = speed || 100,
                options = this.options;

            if (this.type == 1){
                options.scrollbar.height(options.scrollbar_height || options.height);
                this.btn_prev_size = options.btn_prev.height() || 0;
                this.btn_next_size = options.btn_next.height() || 0;
                this.box_size = options.box.outerHeight();//内容的总高度
                this.real_box_size = this.box_size - this.size;//扣掉可见区域的剩余高度
                this.scrollbar_size = options.scrollbar.height();//滚动条的高度
                this.btn_border_top = parseInt(options.btn.css("border-top") || options.btn.css("border-top-width")) || 0;
                this.btn_border_bottom = parseInt(options.btn.css("border-bottom") || options.btn.css("border-bottom-width")) || 0;
                this.scroll_size = this.scrollbar_size - this.btn_border_top - this.btn_border_bottom - this.btn_next_size;//滚动条的最大高度
            } else {
                options.scrollbar.width(options.scrollbar_width || options.width);
                this.btn_prev_size = options.btn_prev.width() || 0;
                this.btn_next_size = options.btn_next.width() || 0;
                this.box_size = options.box.outerWidth();//内容的总高度
                this.real_box_size = this.box_size - this.size;
                this.scrollbar_size = options.scrollbar.width();
                this.btn_border_left = parseInt(options.btn.css("border-left") || options.btn.css("border-left-width")) || 0;
                this.btn_border_right = parseInt(options.btn.css("border-right") || options.btn.css("border-right-width")) || 0;
                this.scroll_size = this.scrollbar_size - this.btn_border_left - this.btn_border_right - this.btn_next_size;//滚动条的最大高度
            }

            this.btn_size = this.size / this.box_size * this.scroll_size;

            if (this.btn_size < options.min_scroll_size){
                this.btn_size = options.min_scroll_size;
            }

            this.remain_size = (this.options.available_scroll_size || this.scroll_size) - this.btn_size;
            this.scroll_per = options.scroll_per;// / this.real_box_size * this.remain_size;

            if (this.box_size > this.size){
                options.scrollbar.show();

                if (this.type == 1){
                    if (animate){
                        options.btn.animate({
                            height : this.btn_size
                        }, speed);
                    } else{
                        options.btn.css({
                            height : this.btn_size,
                            zoom : 1
                        });
                    }

                    var margin_top = Math.abs(parseInt(options.box.css("margin-top")));
                    margin_top = isNaN(margin_top) ? 0 : margin_top;
                    _this.boxScrollTo(margin_top, animate, speed, true);

                } else {
                    if (animate){
                        options.btn.animate({
                            width : this.btn_size
                        }, speed);
                    } else{
                        options.btn.css({
                            width : this.btn_size,
                            zoom : 1
                        });
                    }

                    this.boxScrollTo(Math.abs(parseInt(options.box.css("margin-left"))), animate, speed , true);
                }
            } else {
                options.scrollbar.hide();
                _this.boxScrollTo(0, false, 200, true);
            };
        },

        boxScrollTo : function(box_pos, animate, speed, silent, isstop, callback){
            var _this = this,
                animate = animate === false ? false :  true,
                silent = silent === true ? true : false,
                isstop = isstop === true ? true : false,
                speed = speed || 200,
                callback = typeof callback === "function" ? callback : function(){},
                options = this.options,
                result = true;


            if (box_pos > _this.real_box_size){
                box_pos = _this.real_box_size;
            };

            if (box_pos < 0 || isNaN( box_pos )){
                box_pos = 0;

            }

            if(box_pos == 0 || box_pos == _this.real_box_size){
                result = false;
            }

            var btn_pos = Math.round(box_pos / _this.real_box_size * _this.remain_size);
            btn_pos = isNaN(btn_pos) ? 0 : btn_pos;
            this.btn_pos =  btn_pos;

            if (btn_pos < _this.btn_prev_size){
                btn_pos = _this.btn_prev_size;
            }

            this.box_scroll_pos = box_pos;

            box_pos = -box_pos;

            if (this.type == 1){
                if (animate){
                    if (isstop){
                        options.btn.stop();
                        options.box.stop();
                    }

                    options.btn.animate({
                        "top" : btn_pos
                    }, speed, function(){

                        !silent && options.onscroll.call(_this);
                    });

                    //console.log(box_pos);
                    options.box.animate({
                        "margin-top" : box_pos
                    }, speed, callback);
                } else {

                    options.btn.css({
                        "top" : btn_pos
                    });

                    options.box.css({
                        "margin-top" : box_pos
                    });

                    !silent && options.onscroll.call(_this);
                }
            } else {
                if (animate){

                    if (isstop){
                        options.btn.stop();
                        options.box.stop();
                    }

                    options.btn.animate({
                        "left" : btn_pos
                    }, speed, function(){
                        !silent && options.onscroll.call(_this);
                    });

                    options.box.animate({
                        "margin-left" : box_pos
                    }, speed, callback);
                } else {
                    options.btn.css({
                        "left" : btn_pos
                    });

                    options.box.css({
                        "margin-left" : box_pos
                    });

                    !silent && options.onscroll.call(_this);
                }
            }

            return result;
        },

        scrollTo : function(btn_pos, animate, speed, silent, isstop, callback){
            var _this = this,
                animate = animate === false ? false :  true,
                silent = silent === true ? true : false,
                isstop = isstop === true ? true : false,
                speed = speed || 200,
                options = this.options,
                content_distance;

            if (/([0-9.]+)%/.test(btn_pos)){
                btn_pos = _this.remain_size * RegExp.$1 / 100;
            }

            if (btn_pos > _this.remain_size){
                btn_pos = _this.remain_size;
            };

            if (btn_pos < _this.btn_prev_size){
                btn_pos = _this.btn_prev_size;
            }

            _this.btn_pos = Math.round(btn_pos);
            content_distance = Math.round(btn_pos / _this.remain_size * _this.real_box_size);

            //console.log(_this,btn_pos , _this.remain_size , _this.real_box_size);
            _this.boxScrollTo(content_distance, animate, speed, silent, isstop, callback);
        },

        updatePosition : function (e) {
            var _this = this,
                options = this.options,
                pos = this.type ? getMousePosition(e).y : getMousePosition(e).x,
                span = (pos - _this.lastMousePos),
                btn_pos;

            btn_pos = _this.lastElemOffset + span;
            _this.scrollTo(btn_pos, false, 200, false, false);
        }
    }

    if( {}.toString.call(module) == '[object Object]' ){
        module.exports = ctor;
    }else{
        exports.scrollbar = ctor;
    }

}));