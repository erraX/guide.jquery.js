(function (factory) {

    // AMD
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    }

    // commonJS
    else if (typeof module === 'object' && module.exports) {
        module.exports = function (root, jQuery) {
            if (jQuery === undefined) {
                if (typeof window !== 'undefined') {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }

            factory(jQuery);
            return jQuery;
        }
    }

    // Browser
    else {
        factory(jQuery);
    }
}(function ($) {

    /**
     * 设置默认值
     * 支持深度设置
     *
     * @param {Object} target target
     * @param {Object} defaultObj default object
     * @param {Function} predicate 判断是否需要填入默认值
     */
    function defaults(target, defaultObj, predicate) {
        target = $.extend(true, {}, target);
        predicate = predicate || function (v) {
            return v === undefined;
        };

        Object.keys(defaultObj).forEach(function (key) {
            if (predicate(target[key])) {
                target[key] = defaultObj[key];
            }
            else if (typeof target[key] === 'object'
                && typeof defaultObj[key] === 'object') {
                target[key] = defaults(target[key], defaultObj[key], predicate);
            }
        });

        return target;
    }

    /**
     * 把 在 `target` 中的所有 `methods` 都绑定到 `target`
     *
     * @param {Array.<Function>} methods methods
     * @param {any} target target
     */
    function bindAll(methods, target) {
        methods = methods || [];

        methods.forEach(function (method) {
            var fn = target[method];

            if (!$.isFunction(fn)) {
                return;
            }

            target[method] = fn.bind(target);
        });
    }

    /**
     * 获取 `[data-tag]`
     * 或者 `[data-tag="value"]`
     *
     * @param {string} tag `data-${tag}`
     * @param {string} value `data-tag=${value}`
     * @return {string}
     */
    function attrData(tag, value) {
        var str = '[data-' + tag + ']';

        if (value !== undefined) {
            str = str.replace(']', '') + '="' + value + '"]';
        }

        return str;
    }

    /**
     * 获取一个元素的位置及大小
     *
     * @param {jQuery} $el element
     * @return {Object}
     */
    function getElementRect($el) {
        var offset = $el.offset() || {};

        return {
            offsetTop: offset.top || 0,
            offsetLeft: offset.left || 0,
            height: $el.innerHeight() || 0,
            width: $el.innerWidth() || 0
        };
    }

    /**
     * 在元素周围加一个padding
     *
     * @param {Object} rect rect
     * @param {Object} padding padding
     * @return {Object}
     */
    function expandPadding(rect, padding) {
        if (!padding) {
            return rect;
        }

        rect.width = rect.width + padding.left + padding.right;
        rect.height = rect.height + padding.top + padding.bottom;
        rect.offsetTop = rect.offsetTop - padding.top;
        rect.offsetLeft = rect.offsetLeft - padding.left;

        return rect;
    }

    /**
     * 获取窗口的大小以及滚动情况
     *
     * @return {Object}
     */
    function getWindowRect() {
        var $window = $(window);

        return {
            scrollTop: $window.scrollTop(),
            scrollLeft: $window.scrollLeft(),
            height: $window.innerHeight(),
            width: $window.innerWidth()
        };
    }

    /**
     * 空函数
     *
     * @type {Function}
     */
    var noop = function () {};

    /**
     * 版本号
     *
     * @type {string}
     */
    var version = '1.0.0-beta';

    /**
     * 插件名
     *
     * @type {string}
     */
    var pluginName = 'guide';

    /**
     * 用于生成一个唯一 guide name
     *
     * @type {number}
     */
    var guideIdx = 0;

    /**
     * 默认配置
     *
     * @type {Object}
     */
    var defaultOptions = {

        /**
         * 支持从数组传入 `Guides`
         *
         * @type {Array.<Guide>}
         * @property {HTMLElement} target 需要被引导的元素
         * @property {HTMLElement} content 对应引导内容
         * @property {Object} offset 在 `target` 的坐标上加一个offset，放置 `content`
         * @property {number|string} offset.left offset x 坐标
         * @property {number|string} offset.top offset y 坐标
         * @property {Object|number|string} padding 在对`target` 的遮罩基础上，再扩大一点显示的面积，
         *                                          如果是number或者string类型，则上下左右都是这个值
         * @property {number|string} padding.top padding top
         * @property {number|string} padding.left padding left
         * @property {number|string} padding.bottom padding bottom
         * @property {number|string} padding.right padding right
         * @property {Function} onEnter 切换到此引导时调用
         * @property {Function} onLeave 切出到此引导时调用
         */
        guides: [],

        /**
         * target 元素从哪里去找
         * 没有就全局找
         *
         * @type {string}
         */
        scope: null,

        /**
         * 初始化完成后是否显示
         *
         * @type {boolean}
         */
        showAfterInited: true,

        /**
         * 在对`target` 的遮罩基础上，再扩大一点显示的面积，
         * 如果是number或者string类型，则上下左右都是这个值
         *
         * @type {Object|number|string}
         */
        padding: 10,

        /**
         * Content显示的offset
         *
         * @type {Object|number|string}
         */
        offset: 10,

        /**
         * 遮罩的样式，可以调整一下颜色，zIndex等等
         * 规则对应 `$.css` 方法
         *
         * @type {Object}
         */
        maskStyle: {
            borderColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999
        },

        /**
         * 插件内取需要的DOM，都通过 [data-foo="bar"] 来取
         * 这边保存所有的属性名，没有冲突的话，没必要改这个
         *
         * @type {Object}
         * @property {string} target 需要被引导的元素标签
         * @property {string} content 引导的标签
         * @property {string} role 引导内容中的各个功能标签，back, next, close 等
         */
        attrDataMap: {
            target: 'guide-target',
            content: 'content',
            role: 'role'
        },

        /**
         * 初始化完成后调用
         *
         * @type {Function}
         */
        onInit: function (guidePlugin) {},

        /**
         * 添加一个guid时调用
         * 由于在html里面没法定义函数
         * 所以添加guide的时候可以在这里注入 `onEnter` `onLeave`
         *
         * @type {Function}
         */
        onAddGuide: function (guide, guidePlugin) {},

        /**
         * 删除一个guid时调用
         *
         * @type {Function}
         */
        onRemoveGuide: function (guide, guidePlugin) {},

        /**
         * 点击下一步前/后触发
         *
         * @type {Function}
         */
        beforeNext: function (currentGuide, nextGuide, guidePlugin) {},
        afterNext: function (currentGuide, nextGuide, guidePlugin) {},

        /**
         * 点击上一步前/后触发
         *
         * @type {Function}
         */
        beforeBack: function (currentGuide, previousGuide, guidePlugin) {},
        afterBack: function (currentGuide, previousGuide, guidePlugin) {},

        /**
         * Guide 显示时触发
         *
         * @type {Function}
         */
        onShow: function (guidePlugin) {},

        /**
         * Guide 隐藏时触发
         *
         * @type {Function}
         */
        onHide: function (guidePlugin) {},

        /**
         * 销毁时调用
         *
         * @type {Function}
         */
        onDispose: function (guidePlugin) {}
    };

    /**
     * Guide 插件具体实现
     *
     * @constructor
     * @param {options} options
     * @see defaultOptions
     */
    function Guide(options) {
        bindAll([
            'repaint',
            'handleClickNext',
            'handleClickBack',
            'handleClickClose'
        ], this);

        this.$el = options.$el;
        this.options = options;

        this.guides = [];
        this.status = {
                current: -1,
                show: false
        };

        this.initOptions()
            .initMask()
            .initGuide()
            .bindEvents()
            .next();

        this.options.showAfterInited && this.show();
        this.options.onInit(this);
    }

    /**
     * Guide prototype
     *
     * @type {Object}
     */
    Guide.prototype = {

        /**
         * Assign self
         *
         * @type {Function}
         */
        constructor: Guide,

        /**
         * 遮罩模板
         *
         * @type {string}
         */
        maskTpl: '<div class="guide-mask"></div>',

        /**
         * 遮罩必须的css
         *
         * @type {Object}
         */
        maskStyle: {
            position: 'fixed',
            borderStyle: 'solid',
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        },

        /**
         * 引导内容必须的css
         *
         * @type {Object}
         */
        contentStyle: {
            display: 'none',
            position: 'absolute'
        },

        /**
         * 查询内部元素
         *
         * @param {string} selector selector
         * @return {jQuery}
         */
        $: function (selector) {
            return this.$el.find(selector);
        },

        /**
         * 是否显示引导
         *
         * @return {boolean}
         */
        isShow: function () {
            return this.status.show;
        },

        /**
         * 生成一个唯一id
         *
         * @param {string} prefix prefix
         * @return {string}
         */
        generateName: function (prefix) {
            return prefix + '_' + guideIdx++;
        },

        /**
         * 获取一个`attrDataMap`
         *
         * @param {?string} name name
         * @return {Object | string}
         */
        getAttrDataMap: function (name) {
            var attrDataMap = this.options.attrDataMap;

            if (!name) {
                return attrDataMap;
            }

            return attrDataMap[name] || '';
        },

        /**
         * 解析一个Guide
         *
         * @param {Object} rawGuide 传入的原始数据
         * @return {Object}
         */
        parseGuide: function (rawGuide) {
            var options = this.options;
            var content = rawGuide.content;

            if (!rawGuide.name) {
                rawGuide.name = this.generateName('guide');
            }

            if (!target || !target.length) {
                rawGuide.target = $(options.scope || 'body').find(attrData(this.getAttrDataMap('target'), rawGuide.name));
            }

            var target = rawGuide.target;
            rawGuide = defaults(rawGuide, {
                onEnter: noop,
                onLeave: noop,
                offset: {
                    left: content.data('offsetLeft') || options.offset.left,
                    top: content.data('offsetTop') || options.offset.top
                },
                padding: {
                    top: target.data('paddingTop') || options.padding.top,
                    left: target.data('paddingLeft') || options.padding.left,
                    bottom: target.data('paddingBottom') || options.padding.bottom,
                    right: target.data('paddingRight') || options.padding.right
                }
            });

            rawGuide = defaults(
                rawGuide,
                {
                    back: content.find(attrData(this.getAttrDataMap('role'), 'back')),
                    next: content.find(attrData(this.getAttrDataMap('role'), 'next')),
                    close: content.find(attrData(this.getAttrDataMap('role'), 'close'))
                },
                function (v) {
                    return !v || !v.length;
                }
            );

            return rawGuide;
        },

        /**
         * 添加一个Guide
         *
         * @param {Object} rawGuide 传入的原始数据
         */
        addGuide: function (rawGuide) {
            var guide = this.parseGuide(rawGuide);
            this.options.onAddGuide(rawGuide, this);
            this.guides.push(guide);
        },

        /**
         * 删除一个Guide
         *
         * @param {string} name name
         */
        removeGuide: function (name) {
            for (var i = 0; i < this.guides.length; i++) {
                var guide = this.guides[i];
                if (guide.name === name) {
                    this.options.onRemoveGuide(guide, this);
                    this.guides.splice(i, 1);
                    break;
                }
            }
        },

        /**
         * 创建一个遮罩
         *
         * @return {jQuery} 遮罩
         */
        createMask: function () {
            var $mask = $(this.maskTpl);

            // 内置的 `maskStyle` 不要覆盖掉，万一出了什么问题
            $mask
                .css(this.options.maskStyle)
                .css(this.maskStyle);

            return $mask;
        },

        /**
         * 初始化配置选项
         *
         * @return {Guide}
         */
        initOptions: function () {

            // 转换一下padding数据
            var padding = this.options.padding;
            if (padding && typeof padding !== 'object') {
                this.options.padding = {
                    top: padding,
                    left: padding,
                    bottom: padding,
                    right: padding
                };
            }

            // 转换一下offset数据
            var offset = this.options.offset;
            if (offset && typeof offset !== 'object') {
                this.options.offset = {
                    top: offset,
                    left: offset,
                };
            }

            return this;
        },

        /**
         * 初始化遮罩
         *
         * @return {Guide}
         */
        initMask: function () {
            var $mask = this.createMask();
            this.$el.append($mask);
            this.$mask = $mask;

            return this;
        },

        /**
         * 初始化引导内容
         *
         * @param {jQuery} $content 引导内容
         * @return {jQuery}
         */
        initContent: function ($content) {
            var styles = $.extend({
                zIndex: this.options.maskStyle.zIndex + 1
            }, this.contentStyle);

            $content.css(styles);
            return $content;
        },

        /**
         * 初始化Guide
         *
         * @return {Guide}
         */
        initGuide: function () {
            var me = this;

            var attrTarget = this.getAttrDataMap('target');
            var attrContent = this.getAttrDataMap('content');
            var attrRole = this.getAttrDataMap('role');

            this.$el.hide();

            // 从DOM中添加guide
            // $('[data-content]')
            this.$(attrData(attrContent)).each(function () {
                var $content = $(this);
                var name = $content.data(attrContent);

                if (!name) {
                    return;
                }

                me.initContent($content);
                me.addGuide({
                    name: name,
                    content: $content
                });
            });

            // 从配置中添加guide
            this.options.guides.forEach(function (guide) {
                me.addGuide(guide);
            });

            console.log('All Guides:', this.guides);
            return this;
        },

        /**
         * 绑定事件
         *
         * @return {Guide}
         */
        bindEvents: function () {
            this.guides.forEach(function (guide) {
                guide.close.length && guide.close.on('click', this.handleClickClose);
                guide.next.length && guide.next.on('click', this.handleClickNext);
                guide.back.length && guide.back.on('click', this.handleClickBack);
            }, this);

            $(window).on('resize', this.repaint);
            $(window).on('scroll', this.repaint);

            return this;
        },

        /**
         * 点击下一步
         *
         * @param {Event}
         */
        handleClickNext: function (evt) {
            this.next();
        },

        /**
         * 点击上一步
         *
         * @param {Event}
         */
        handleClickBack: function (evt) {
            this.back();
        },

        /**
         * 点击关闭
         *
         * @param {Event}
         */
        handleClickClose: function (evt) {
            this.hide();
        },

        /**
         * 隐藏所有引导页
         */
        hideAll: function () {
            this.guides.forEach(function (guide) {
                guide.content.hide();
            });
        },

        /**
         * 重绘
         */
        repaint: function () {
            var curGuide = this.guides[this.status.current];

            if (!curGuide) {
                return;
            }

            this.hideAll();

            var $target = curGuide.target;
            var targetRect = getElementRect($target);
            targetRect = expandPadding(targetRect, curGuide.padding);

            var $content = curGuide.content;
            var contentRect = getElementRect($content);

            var contentOffsetLeft = curGuide.offset.left;
            var contentOffsetTop = curGuide.offset.top;

            var windowRect = getWindowRect();

            // 高亮 `$target` 元素，内容显示在他旁边
            if ($target && $target.length) {
                var maskScrollTop = targetRect.offsetTop - windowRect.scrollTop;
                var maskScrollLeft = targetRect.offsetLeft - windowRect.scrollLeft;
                var maskTopWidth = maskScrollTop > 0 ? maskScrollTop : 0;
                var maskLeftWidth = maskScrollLeft > 0 ? maskScrollLeft : 0;
                var maskRightWidth = (maskScrollLeft + targetRect.width) > 0
                    ? windowRect.width - (targetRect.width + maskScrollLeft)
                    : windowRect.width;

                var maskBottomWidth = (maskScrollTop + targetRect.height) > 0
                    ? windowRect.height - (targetRect.height + maskScrollTop)
                    : windowRect.height;

                $content.css({
                    display: 'block',
                    position: 'absolute',
                    top: targetRect.offsetTop + contentOffsetTop,
                    left: targetRect.offsetLeft + contentOffsetLeft
                });

                this.$mask.css({
                    width: targetRect.width + (maskScrollLeft < 0 ? maskScrollLeft : 0),
                    height: targetRect.height + (maskScrollTop < 0 ? maskScrollTop : 0),
                    borderTopWidth: maskTopWidth,
                    borderBottomWidth: maskBottomWidth,
                    borderLeftWidth: maskLeftWidth,
                    borderRightWidth: maskRightWidth
                });
            }

            // 没有对应元素，那就放在屏幕中间
            else {
                var middleHeight = (windowRect.height - contentRect.height) / 2;
                var middleWidth = (windowRect.width - contentRect.width) / 2;

                $content.css({
                    display: 'block',
                    position: 'fixed',
                    top: middleHeight > 0 ? middleHeight : 0,
                    left: middleWidth > 0 ? middleWidth : 0
                });

                this.$mask.css({
                    width: contentRect.width,
                    height: contentRect.height,
                    borderTopWidth: middleHeight,
                    borderBottomWidth: middleHeight,
                    borderLeftWidth: middleWidth,
                    borderRightWidth: middleWidth
                });
            }
        },

        /**
         * 上一条
         */
        back: function () {
            var current = this.status.current;

            if (current <= 0) {
                return;
            }

            var currentGuide = this.guides[current];
            var previousGuide = this.guides[current - 1];

            this.options.beforeBack(currentGuide, previousGuide, this);
            currentGuide && currentGuide.onLeave(currentGuide, this);
            this.status.current--;
            this.repaint();
            previousGuide && previousGuide.onEnter(previousGuide, this);
            this.options.afterBack(currentGuide, previousGuide, this);
        },

        /**
         * 下一条
         */
        next: function () {
            var current = this.status.current;

            if (current >= this.guides.length - 1) {
                return;
            }

            var currentGuide = this.guides[current];
            var nextGuide = this.guides[current + 1];

            this.options.beforeNext(currentGuide, nextGuide, this);
            currentGuide && currentGuide.onLeave(currentGuide, this);
            this.status.current++;
            this.repaint();
            nextGuide && nextGuide.onEnter(nextGuide, this);
            this.options.afterNext(currentGuide, nextGuide, this);
        },

        /**
         * 显示引导
         */
        show: function () {
            this.$el.show();
            this.status.show = true;
            this.options.onShow(this);
        },

        /**
         * 隐藏引导
         */
        hide: function () {
            this.$el.hide();
            this.status.show = false;
            this.options.onHide(this);
        },

        /**
         * 销毁
         */
        dispose: function () {
            $(window).unbind('scroll', this.repaint);
            $(window).unbind('resize', this.repaint);
            this.$el.remove();
        }
    };

    // 有了就不要注册了
    if ($.fn.hasOwnProperty(pluginName)) {
        return;
    }

    $.fn[pluginName] = function (options) {
        var $el = $(this);

        if (!$(this).data('plugin_' + pluginName)) {
            options = defaults(options, defaultOptions);
            options = $.extend({$el: $el}, options);

            // 可通过 `$el.data('plugin_guide')` 取数据
            $el.data('plugin_' + pluginName, new Guide(options));
        }
    };

    $.fn[pluginName].version = version;
}));


