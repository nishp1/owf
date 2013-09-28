/*!

Split Pane v0.3

Copyright (c) 2012 Simon Hagström

Released under the MIT license
https://raw.github.com/shagstrom/split-pane/master/LICENSE

Changes:
- refactor to accept options when instantiating
- added support for destroying and drag proxy (to minimize reflows)
- added events: dragstart, dragstop, resize, layoutChange

*/
;(function($) {

        // borrowed from lodash: MIT Licenced
        var debounce = function (func, wait, immediate) {
            var args,
            result,
            thisArg,
            timeoutId;

            function delayed() {
                timeoutId = null;
                if (!immediate) {
                    result = func.apply(thisArg, args);
                }
            }
            return function() {
                var isImmediate = immediate && !timeoutId;
                args = arguments;
                thisArg = this;

                clearTimeout(timeoutId);
                timeoutId = setTimeout(delayed, wait);

                if (isImmediate) {
                    result = func.apply(thisArg, args);
                }
                return result;
            };
        },
        EVENTS = {
            DRAG_START: 'dragstart',
            DRAG_END: 'dragstop',
            LAYOUT_CHANGE: 'layoutChange',
            RESIZE: 'resize'
        },
        $document = $(document),
        slice = Array.prototype.slice,
        horizontal = 'horizontal',
        vertical = 'vertical',
        horizontalPercent = 'horizontal-percent',
        fixedTop = 'fixed-top',
        fixedBotom = 'fixed-bottom',
        verticalPercent = 'vertical-percent',
        fixedLeft = 'fixed-left',
        fixedRight = 'fixed-right',
        dividerProxy = 'divider-proxy',
        allClasses = [horizontalPercent, fixedTop, fixedBotom, verticalPercent, fixedLeft, fixedRight].join(' ');
        horizontal_divider_tpl = '<div class="divider horizontal-divider"></div>',
        vertical_divider_tpl = '<div class="divider vertical-divider"></div>'
        resize_shim_tpl = '<div class="resize-shim"></div>',
        pxUnitsRegex = /^\d+(\.\d+)?px$/i,
        percentageUnitsRegex = /^\d+(\.\d+)?%$/i,
        isPercentageSize = function (size) {
            return size && percentageUnitsRegex.test(size);
        },
        isPixelSize = function (size) {
            return size && pxUnitsRegex.test(size);
        },
        horizontalDefaults = {
            orientation: 'horizontal',
            panes: [
                { height: '50%'},
                { height: '50%'}
            ]
        },
        verticalDefaults = {
            orientation: 'vertical',
            panes: [
                { width: '50%'},
                { width: '50%'}
            ]
        },
        initHorizontal = function ($boxes, $firstPane, $divider, $lastPane, firstPaneOptions, lastPaneOptions) {
            var boxClass, firstPaneCss, dividerCss, lastPaneCss,
                firstPaneHeight = firstPaneOptions.height,
                lastPaneHeight = lastPaneOptions.height;

            if( isPercentageSize( firstPaneHeight ) ) {
                boxClass = horizontalPercent;
                firstPaneCss = { bottom: 100 - parseInt(firstPaneHeight) + '%' };
                lastPaneCss = { height: 100 - parseInt(firstPaneHeight) + '%' };
                dividerCss = firstPaneCss;
            }
            else if( isPixelSize( firstPaneHeight ) ){
                boxClass = fixedTop;
                firstPaneCss = { height: firstPaneHeight };
                lastPaneCss = { top: firstPaneHeight };
                dividerCss = lastPaneCss;
            }
            else if( isPixelSize( lastPaneHeight ) ){
                boxClass = fixedBotom;
                firstPaneCss = { bottom: lastPaneHeight };
                lastPaneCss = { height: lastPaneHeight };
                dividerCss = firstPaneCss;
            }

            $boxes.addClass(boxClass);
            $firstPane.css(firstPaneCss);
            $divider.css(dividerCss);
            $lastPane.css(lastPaneCss);
        },
        initVertical = function($boxes, $firstPane, $divider, $lastPane, firstPaneOptions, lastPaneOptions) {
            var boxClass, firstPaneCss, dividerCss, lastPaneCss,
                firstPaneWidth = firstPaneOptions.width,
                lastPaneWidth = lastPaneOptions.width;

            if( isPercentageSize( firstPaneWidth ) ) {
                boxClass = verticalPercent;
                firstPaneCss = { right: 100 - parseInt(firstPaneWidth) + '%' };
                lastPaneCss = { width: 100 - parseInt(firstPaneWidth) + '%' };
                dividerCss = firstPaneCss;
            }
            else if( isPixelSize( firstPaneWidth ) ){
                boxClass = fixedLeft;
                firstPaneCss = { width: firstPaneWidth };
                lastPaneCss = { left: firstPaneWidth };
                dividerCss = lastPaneCss;
            }
            else if( isPixelSize( lastPaneWidth ) ){
                boxClass = fixedRight;
                firstPaneCss = { right: lastPaneWidth };
                lastPaneCss = { width: lastPaneWidth };
                dividerCss = firstPaneCss;
            }

            $boxes.addClass(boxClass);
            $firstPane.css(firstPaneCss);
            $divider.css(dividerCss);
            $lastPane.css(lastPaneCss);
        },
        methods = {
            init: function(options) {
                // destroy if existing
                methods['destroy'].call(this);

                var $boxes = this,
                    $firstPane = $boxes.children('.pane:first').addClass('one'),
                    $lastPane = $boxes.children('.pane:last').addClass('two'),
                    $divider, orientation, panes;

                options = $.extend({}, (options && options.orientation === horizontal) ? horizontalDefaults : verticalDefaults, options);

                $boxes
                    .data('splitter', options)
                    .each(setMinHeightAndMinWidth)
                    .append(resize_shim_tpl);

                $firstPane.after(options.orientation === horizontal ? horizontal_divider_tpl : vertical_divider_tpl);
                $boxes.children('.divider').on('mousedown.splitter', mousedownHandler);

                $divider = $boxes.children('.divider');
                orientation = options.orientation;
                panes = options.panes;

                (orientation === vertical ? initVertical : initHorizontal)($boxes, $firstPane, $divider, $lastPane, panes[0], panes[1]);

                setTimeout(function() {
                    // Doing this later because of an issue with Chrome (v23.0.1271.64) returning split-pane width = 0
                    // and triggering multiple resize events when page is being opened from an <a target="_blank"> .
                    $boxes.on('_splitpaneparentresize', parentresizeHandler);
                    //$(window).trigger('resize');
                }, 100);

                return this;
            },
            destroy: function () {
                var $boxes = this;
                if(!$boxes.data('splitter')) {
                    return;
                }

                $boxes
                    .off('_splitpaneparentresize')
                    .removeData('splitter').removeData('_splitpaneparentresizeHandler')
                    .removeClass(allClasses)
                    .children('.divider').off('.splitter').remove();

                $boxes.children('.resize-shim').remove();
                $boxes.children('.pane').addBack().removeAttr('style');

                return this;
            }
        };
    
    $.fn.splitter = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, slice.call( arguments, 1 ) );
        }
        else if ( typeof method === 'object' || !method ) {
            return methods.init.apply( this, arguments );
        }
        else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.splitter' );
        }
    };

    var SPLITPANERESIZE_HANDLER = '_splitpaneparentresizeHandler';

    /**
     * A special event that will "capture" a resize event from the parent box  or window.
     * The event will NOT propagate to grandchildren.
     */
    jQuery.event.special._splitpaneparentresize = {
        setup: function(data, namespaces) {
            var element = this;
            var parent = $(this).parent().closest('.box ')[0] || window;

            $(this).data(SPLITPANERESIZE_HANDLER, debounce(function(event) {
                var target = event.target === document ? window : event.target;
                if (target === parent) {
                    event.type = "_splitpaneparentresize";
                    jQuery.event.handle.apply(element, arguments);
                }
                else {
                    event.stopPropagation();
                }
            }, 200));

            $(parent).bind('resize', $(this).data(SPLITPANERESIZE_HANDLER));
        },
        teardown: function(namespaces) {
            var parent = $(this).parent().closest('.box ')[0] || window;
            $(parent).off('resize', $(this).data(SPLITPANERESIZE_HANDLER));
            $(this).removeData(SPLITPANERESIZE_HANDLER);
        }
    };

    function setMinHeightAndMinWidth() {
        var $box = $(this),
            $firstComponent = $box.children('.pane:first'),
            $divider = $box.children('.divider'),
            $lastComponent = $box.children('.pane:last');
        if ($box.is('.fixed-top, .fixed-bottom, .horizontal-percent')) {
            $box.css('min-height', (minHeight($firstComponent) + minHeight($lastComponent) + $divider.height()) + 'px');
        } else {
            $box.css('min-width', (minWidth($firstComponent) + minWidth($lastComponent) + $divider.width()) + 'px');
        }
    }

    function mousedownHandler(event) {
        event.preventDefault();
        
        var $this = $(this).trigger(EVENTS.DRAG_START),
            $dividerProxy = $this.clone().addClass(dividerProxy).insertAfter($this),
            $resizeShim = $this.siblings('.resize-shim').show(),
            mousemove = createMousemove($this.parent(), event.pageX, event.pageY);
        
        $document
            .on('mousemove', mousemove)
            .one('mouseup', function(event) {
                mousemove(event, true);

                // cleanup
                $resizeShim.hide();
                $document.off('mousemove', mousemove);
                $dividerProxy.remove();
                
                $this.trigger(EVENTS.DRAG_END).trigger(EVENTS.LAYOUT_CHANGE);
            });
    }

    function parentresizeHandler() {
        var $box = $(this),
            $firstComponent = $box.children('.pane:first'),
            $divider = $box.children('.divider'),
            $lastComponent = $box.children('.pane:last');
        if ($box.is('.fixed-top')) {
            var maxfirstComponentHeight = $box.height() - minHeight($lastComponent) - $divider.height();
            if ($firstComponent.height() > maxfirstComponentHeight) {
                setTop($box, $firstComponent, $divider, $lastComponent, maxfirstComponentHeight + 'px');
            };
        } else if ($box.is('.fixed-bottom')) {
            var maxLastComponentHeight = $box.height() - minHeight($firstComponent) - $divider.height();
            if ($lastComponent.height() > maxLastComponentHeight) {
                setBottom($box, $firstComponent, $divider, $lastComponent, maxLastComponentHeight + 'px')
            }
        } else if ($box.is('.horizontal-percent')) {
            var maxLastComponentHeight = $box.height() - minHeight($firstComponent) - $divider.height();
            if ($lastComponent.height() > maxLastComponentHeight) {
                setBottom($box, $firstComponent, $divider, $lastComponent, (maxLastComponentHeight / $box.height() * 100) + '%');
            } else {
                var lastComponentMinHeight = minHeight($lastComponent);
                if ($box.height() - $firstComponent.height() - $divider.height() < lastComponentMinHeight) {
                    setBottom($box, $firstComponent, $divider, $lastComponent, (lastComponentMinHeight / $box.height() * 100) + '%');
                }
            }
        } else if ($box.is('.fixed-left')) {
            var maxFirstComponentWidth = $box.width() - minWidth($lastComponent) - $divider.width();
            if ($firstComponent.width() > maxFirstComponentWidth) {
                setLeft($box, $firstComponent, $divider, $lastComponent, maxFirstComponentWidth + 'px');
            };
        } else if ($box.is('.fixed-right')) {
            var maxLastComponentWidth = $box.width() - minWidth($firstComponent) - $divider.width();
            if ($lastComponent.width() > maxLastComponentWidth) {
                setRight($box, $firstComponent, $divider, $lastComponent, maxLastComponentWidth + 'px')
            }
        } else if ($box.is('.vertical-percent')) {
            var maxLastComponentWidth = $box.width() - minWidth($firstComponent) - $divider.width();
            if ($lastComponent.width() > maxLastComponentWidth) {
                setRight($box, $firstComponent, $divider, $lastComponent, (maxLastComponentWidth / $box.width() * 100) + '%');
            } else {
                var lastComponentMinWidth = minWidth($lastComponent);
                if ($box.width() - $firstComponent.width() - $divider.width() < lastComponentMinWidth) {
                    setRight($box, $firstComponent, $divider, $lastComponent, (lastComponentMinWidth / $box.width() * 100) + '%');
                }
            }
        }

        $box.triggerHandler(EVENTS.RESIZE);
    }

    function createMousemove($box, pageX, pageY) {
        var $firstComponent = $box.children('.pane:first'),
            $divider = $box.children('.divider').not('.' + dividerProxy),
            $lastComponent = $box.children('.pane:last');

        if ($box.is('.fixed-top')) {
            var firstComponentMinHeight =  minHeight($firstComponent),
                maxFirstComponentHeight = $box.height() - minHeight($lastComponent) - $divider.height(),
                topOffset = $divider.position().top - pageY;
            return function(event, flush) {
                event.preventDefault();
                var top = Math.min(Math.max(firstComponentMinHeight, topOffset + event.pageY), maxFirstComponentHeight);
                setTop($box, $firstComponent, $divider, $lastComponent, top + 'px', flush)
            };
        } else if ($box.is('.fixed-bottom')) {
            var lastComponentMinHeight = minHeight($lastComponent),
                maxLastComponentHeight = $box.height() - minHeight($firstComponent) - $divider.height(),
                bottomOffset = $lastComponent.height() + pageY;
            return function(event, flush) {
                event.preventDefault();
                var bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - event.pageY), maxLastComponentHeight);
                setBottom($box, $firstComponent, $divider, $lastComponent, bottom + 'px', flush);
            };
        } else if ($box.is('.horizontal-percent')) {
            var boxHeight = $box.height(),
                lastComponentMinHeight = minHeight($lastComponent),
                maxLastComponentHeight = boxHeight - minHeight($firstComponent) - $divider.height(),
                bottomOffset = $lastComponent.height() + pageY;
            return function(event, flush) {
                event.preventDefault();
                var bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - event.pageY), maxLastComponentHeight);
                setBottom($box, $firstComponent, $divider, $lastComponent, (bottom / boxHeight * 100) + '%', flush);
            };
        } else if ($box.is('.fixed-left')) {
            var firstComponentMinWidth = minWidth($firstComponent),
                maxFirstComponentWidth = $box.width() - minWidth($lastComponent) - $divider.width(),
                leftOffset = $divider.position().left - pageX;
            return function(event, flush) {
                event.preventDefault();
                var left = Math.min(Math.max(firstComponentMinWidth, leftOffset + event.pageX), maxFirstComponentWidth);
                setLeft($box, $firstComponent, $divider, $lastComponent, left + 'px', flush)
            };
        } else if ($box.is('.fixed-right')) {
            var lastComponentMinWidth = minWidth($lastComponent),
                maxLastComponentWidth = $box.width() - minWidth($firstComponent) - $divider.width(),
                rightOffset = $lastComponent.width() + pageX;
            return function(event, flush) {
                event.preventDefault();
                var right = Math.min(Math.max(lastComponentMinWidth, rightOffset - event.pageX), maxLastComponentWidth);
                setRight($box, $firstComponent, $divider, $lastComponent, right + 'px', flush);
            };
        } else if ($box.is('.vertical-percent')) {
            var boxWidth = $box.width(),
                lastComponentMinWidth = minWidth($lastComponent),
                maxLastComponentWidth = boxWidth - minWidth($firstComponent) - $divider.width(),
                rightOffset = $lastComponent.width() + pageX;
            return function(event, flush) {
                event.preventDefault();
                var right = Math.min(Math.max(lastComponentMinWidth, rightOffset - event.pageX), maxLastComponentWidth);
                setRight($box, $firstComponent, $divider, $lastComponent, (right / boxWidth * 100) + '%', flush);
            };
        }
    }

    function minHeight($element) {
        return parseInt($element.css('min-height')) || 0;
    }

    function minWidth($element) {
        return parseInt($element.css('min-width')) || 0;
    }

    function setTop($box, $firstComponent, $divider, $lastComponent, top, flush) {
        if(flush === true) {
            $firstComponent.css('height', top);
            $lastComponent.css('top', top);
            $box.triggerHandler(EVENTS.RESIZE);
        }
        $divider.css('top', top);
    }

    function setBottom($box, $firstComponent, $divider, $lastComponent, bottom, flush) {
        if(flush === true) {
            $firstComponent.css('bottom', bottom);
            $lastComponent.css('height', bottom);
            $box.triggerHandler(EVENTS.RESIZE);
        }
        $divider.css('bottom', bottom);
    }

    function setLeft($box, $firstComponent, $divider, $lastComponent, left, flush) {
        if(flush === true) {
            $firstComponent.css('width', left);
            $lastComponent.css('left', left);
            $box.triggerHandler(EVENTS.RESIZE);
        }
        $divider.css('left', left);
    }

    function setRight($box, $firstComponent, $divider, $lastComponent, right, flush) {
        if(flush === true) {
            $firstComponent.css('right', right);
            $lastComponent.css('width', right);
            $box.triggerHandler(EVENTS.RESIZE);
        }
        $divider.css('right', right);
    }

})(jQuery);
