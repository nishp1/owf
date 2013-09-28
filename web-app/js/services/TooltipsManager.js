/*
 * Copyright 2013 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define([
    'events/EventBus',
    'jquery',
    'lodash',
    'bootstrap/bootstrap-tooltip',
    'bootstrap/bootstrap-popover'
], function(EventBus, $, _) {

    var $el,
        elType,
        timeout,
        isMouseDown = false,
        initialized = false,
        defaults = {
            selector: '[rel=tooltip], [rel=popover]',
            showDelay: 1000,
            useShims: false
        };

    function hide ($tip, type) {

        if($tip && type && $tip.data('__tipShown')) {
            $tip[type]('hide');
            $tip.data('__tipShown', false);
        }

    }

    function onShown(type) {
        return function (e) {
            $(e.target).data(type).$tip.bgiframe();
        };
    }

    function init (options) {
        if(initialized === true) {
            return;
        }
        options = _.extend({}, defaults, options);

        EventBus.on('modal:hidden', function (e) {
            hide($el, elType);
            $el = null;
        });

        var $body = $(document.body);
        $body
            .on('mousedown', options.selector, function(evt) {
                isMouseDown = true;
            })
            .on('mouseup', options.selector, function(evt) {
                isMouseDown = false;
            })
            .on('mouseenter focusin', options.selector, function(evt) {
                var $this = $(evt.type === 'focusin' ? evt.target : evt.currentTarget),
                    type = $this.attr('rel');
                
                // clear previous timeouts
                clearTimeout(timeout);

                // prevent tooltip/popovers from showing if element is not visible
                // this occurs when use hides the item, leaves the browser window and comes back to window later.
                if(!type || isMouseDown || !$this.is(':visible')) {
                    return;
                }

                // hide previous tooltip/popover
                hide($el, elType);

                $el = $this;
                elType = type;

                // only initialize once
                if($el.data('__tipShown') === undefined) { 
                    $el[type]({
                        html: 'true',
                        placement: 'bottom',
                        container: 'body',
                        trigger: 'manual'
                    });
                }
                else {
                    // Update the title and contents from the element's attributes
                    // in case they have been updated.
                    var content = $el.attr('data-content');
                    var title = $el.attr('data-original-title') || $el.attr('title');
                    if (content) {
                        $el.data(type).options.content = content;
                    }
                    if (title) {
                        $el.data(type).options.title = title;
                    }
                }

                timeout = setTimeout(function () {
                    // it is possible $el is nulled by modal:hidden event
                    if($el) {
                        $el[elType]('show');
                        $el.data('__tipShown', true);
                    }

                }, options.showDelay);
                
            })
            .on('mouseleave mousedown focusout', options.selector, function(evt) {
                var $this = $(evt.type === 'focusout'? evt.target: evt.currentTarget),
                    type = $this.attr('rel');

                clearTimeout(timeout);
                hide($this, type);
                $el = null;
            });

        if(options.useShims) {
            $body
                .on('tooltipshown', onShown('tooltip'))
                .on('popovershown', onShown('popover'));
        }
        
        initialized = true;
    }

    return {
        init: init
    };
});
