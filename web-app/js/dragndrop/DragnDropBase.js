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

/*globals define*/
;(function(window, undefined) {
    'use strict';

    var $, 
        Constants,
        document = window.document;

    /**
     * @class DragnDropBase
     *
     * @description The base class for drag and drop functionality. This class
     * contains code that is common to both the container-side and widget-side drag
     * and drop implementations
     *
     * @param eventing The eventing implementation to use (IE, OWF.Eventing on the widget side,
     * or the eventingContainer on the container side)
     * @param comms The Comms implementation to use
     */
    function DragnDropBase(eventing, comms) {
        this.eventing = eventing;
        this.comms = comms;

        this.dragIndicatorText = $('<span>').addClass('ddText'),
        this.dragIndicator = $('<span>')
            .addClass("ddBox ddBoxCannotDrop")
            .css('display', 'none')
            .append(this.dragIndicatorText);

        this.callbacks = {
            dragStart: $.Callbacks('stopOnFalse'),
            dragStop: $.Callbacks('stopOnFalse'),
            dropReceive: $.Callbacks('stopOnFalse')
        };
    }


    DragnDropBase.prototype = {
        /**
         * @private
         * Firefox 4 and up require faking 
         * mouse events, so we need to detect
         * those browsers
         */
        isFF4Plus: function() {
            return (/Firefox[\/\s](\d+\.\d+)/).test(window.navigator.userAgent) &&
                parseInt(RegExp.$1, 10) >= 4;
        },

        /**
         * @private 
         * Creates and fires a browser mouse event.
         *
         * @param el the DOM element to be the target of the event
         * @param type The type of event (mousedown, mouseover, mouseup, etc)
         * @param msg An object containing pageX and pageY properties to use in the
         * construction of the mouse event
         * @param relatedTarget A DOM element to use as the related target for mouseover
         * and mouseout events
         */
        fireMouseEvent: function (el, type, msg, relatedTarget) {
            var evt;
            if (!el) {
                return;
            }

            if(window.document.createEvent) {
                evt = window.document.createEvent('MouseEvents');
                evt.initMouseEvent(type, true, true, window, 1, 
                    msg.screenX, msg.screenY, msg.pageX, msg.pageY, 
                    false, false, false, false, null, relatedTarget 
                );
                el.dispatchEvent(evt);
            }
            else if(window.document.createEventObject) {
                evt = window.document.createEventObject();
                el.fireEvent('on' + type, evt);
            }
        },

        /**
         * @private
         * disable/enable text selection globally.
         * This is necessary for IE
         *
         * @param enabled {Boolean} Whether to enable or disable text selection
         */
        setGlobalSelectionEnabled: function(enabled) {
            document.onselectstart = function() {
                return enabled;
            };
            document.ondragstart = function () {
                return enabled;
            };
        },

        /**
         * @private
         *
         * Handler for when we are notified that a drag has started in a widget.
         * Fires the dragStart callbacks and sets up the drag state
         */
        onStartDrag: function (sender, msg) {
            this.dragging = true;
            this.callbacks.dragStart.stopped = false;
            this.dragStartData = msg;

            if (!this.fireCallbacks('dragStart', arguments)) {
                this.dragging = false;
                return;
            }

            this.setGlobalSelectionEnabled(false);
            this.dragIndicatorText.text(msg.dragDropLabel);
            this.attachMouseListeners();
        },

        /**
         * @private
         *
         * Handler for mouseUp which cancels the drag
         */
        mouseUp: function() {
            this.dragging = false;
            this.hideDragIndicator();
            this.setGlobalSelectionEnabled(true);
        },

        /**
         * Hides the drag indicator element that follows the mouse around
         */
        hideDragIndicator: function() {
            this.dragIndicator.css('display', 'none');
        },

        /**
         * @private
         * Set up internal channel subscriptions
         */
        initChannels: function() {
            this.eventing.subscribe(Constants.DRAG_START_CHANNEL, 
                    $.proxy(this.onStartDrag, this));
            this.eventing.subscribe(Constants.DRAG_OUT_CHANNEL, 
                    $.proxy(this.hideDragIndicator, this));
        },
        
        /**
         * @private
         *
         * Attaches the mousemove and mouseup listeners 
         */
        attachMouseListeners: function() {
            $(document)
                .on('mousemove', $.proxy(this.mouseMove, this))
                .on('mouseup', $.proxy(this.mouseUp, this));
        },

        /**
         * @private
         *
         * Detaches the mousemove and mouseup listeners
         */
        detachMouseListeners: function() {
            $(document)
                .off('mousemove', $.proxy(this.mouseMove, this))
                .off('mouseup', $.proxy(this.mouseUp, this));
        },

        /**
         * @methodOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @description Initializes the WidgetDragAndDrop object.  Using this function is 
         * only required if autoInit config is false in the constructor.  This function is 
         * sometimes useful when it is necessary to defer drag and drop event handling after
         * creating the Ozone.dragAndDrop.WidgetDragAndDrop object
         * @param {Object} [cfg] config object
         * @see <a href="#constructor">constructor</a>
         */
        init: function() {
            this.initChannels();
            this.initMouseEventComms();
        },

        /**
         * @methodOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @description Adds a function as a callback to Drag and Drop events.  
         *  This function supports multiple callbacks for the same event by 
         *  allowing the user call it more than once with different callback functions
         * @param {String} eventName The event name.
         * @param {Function} cb The function to execute as a callback.
         * @see <a href="#dragStart">dragStart Event</a> -
         * the callback for the dragStart event is called with the same config object used 
         *  in the <a href="#doStartDrag">doStartDrag</a> function
         * with the exception of the dragDropData and the dragZone properties.
         * @see <a href="#dragStop">dragStop Event</a> -
         * If the drag stopped in the same widget that started the drag the callback for 
         *  dragStop will be called with the dropTarget
         * HTML node otherwise the first argument will be null.
         * @see <a href="#dropReceive">dropReceive Event</a> -
         * the callback for the dropReceive event is called for any drop that occurs on a widget.
         *  If one has multiple dropZones
         * in a widget it is easier to use <a href="#addDropZoneHandler">addDropZoneHandler</a>
         * @example
         * //example dragStart handler which highlights an Ext Grid when a drag occurs
         * this.wdd.addCallback('dragStart', (function(sender, msg){
         *      //get the Ext Grid
         *      var grid = this.getComponent(this.gridId);
         *
         *      //check custom dragDropGroup property to see if the drag is meant for this grid
         *      //if so highlight the grid by adding the ddOver class
         *      if (grid && msg != null && msg.dragDropGroup == 'users') {
         *          grid.getView().scroller.addClass('ddOver');
         *      }
         *  }).createDelegate(this));  //createDelegate is an Ext function which sets the scope
         *
         *  //this.wdd is a initialized WidgetDragAndDrop object
         *   this.wdd.addCallback('dropReceive',owfdojo.hitch(this,function(msg) {
         *      //msg.dragDropData contains the data
         *      //this example the data is a channel name that will be subscribed to
         *      this.subscribeToChannel(msg.dragDropData);
         *   }));
         */
        addCallback: function(eventName, cb) {
            var me = this;

            /**
             * This wrapper is necessary so that we can determine if the
             * callback chain was stopped
             */
            function cbWrapper() {
                /*jshint validthis:true*/
                var retval = cb.apply(this, arguments);
                if (retval === false) {
                    me.callbacks[eventName].stopped = true;
                }

                return retval;
            }

            if (!me.callbacks[eventName]) {
                throw "Unsupported event name: " + eventName;
            }
            
            this.callbacks[eventName].add(cbWrapper);
        },

        /**
         * @private
         *
         * convenience function for registering callbacks on multiple events at once
         */
        addCallbacks: function(cfg) {
            for (var cbName in cfg) {
                if (cfg.hasOwnProperty(cbName)) {
                    this.addCallback(cbName, cfg[cbName]);
                }
            }
        },

        /**
         * @private
         * Fires the callback identified by eventName, halting execution
         * if any of them return false. 
         * @return whether or not any of the callbacks returned false
         */
        fireCallbacks: function(eventName, args) {
            if (!this.callbacks[eventName]) {
                throw "Unsupported event name: " + eventName;
            }
            
            this.callbacks[eventName].fire.apply(undefined, args);
            if (this.callbacks[eventName].stopped) {
                return false;
            }

            return true;
        },

        /**
         * @memberOf OWF.DragAndDrop
         * @name isDragging
         * @description returns whether a drag is in progress
         */
        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @name isDragging
         * @description returns whether a drag is in progress
         */
        isDragging : function() {
            return this.dragging;
        },

        //are we currently dragging
        dragging: false
    };

    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(['comms/Constants', 'jquery'], function(constants, jquery) {
            Constants = constants;
            $ = jquery;
            return DragnDropBase;
        });
    }
    else {
        var OWF = window.OWF;
        $ = window._$;
        Constants = OWF.Comms.Constants;
        OWF.DragAndDrop = OWF.DragAndDrop || {};
        OWF.DragAndDrop.Base = DragnDropBase;
    }

})(window);
