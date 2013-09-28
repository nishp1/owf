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

/*globals window, document*/
define([
    'eventing/Container',
    'comms/Container',
    'comms/Comms',
    'comms/Constants',
    'dragndrop/DragnDropBase',
    'util/Util',
    'lodash',
    'jquery'
], function(EventingContainer, CommsContainer, Comms, Constants, DragnDropBase, 
        Util, _, $) {
    'use strict';

    /**
     * The container for the drag and drop API
     *
     * @class
     * @extends DragnDropBase
     * @param eventing The eventing implementation
     * @param comms The comms implementation
     */
    function DragnDropContainer() {
        DragnDropBase.apply(this, arguments);

        $(document.body).append(this.dragIndicator);
    }

    DragnDropContainer.prototype = _.extend(new DragnDropBase(), /** @lends DragnDropContainer */{

        /**
         * @private
         *
         * receives faked mousemove events and handles them as if they are real, forwarding
         * them to to appropriate widget if necessary
         *
         * @param msg The faked event. Should contain pageX and pageY properties at a minimum
         */
        commsMouseMoveHandler: function(msg) {
            var senderObj = JSON.parse(msg.sender),
                iframeId = JSON.stringify({id:senderObj.id}),
                position = $(CommsContainer.getIframeEl(senderObj.id)).offset(),
                el;

            // convert widget pageX and pageY to container pageX and pageY
            msg.pageX += position.left;
            msg.pageY += position.top;

            el = document.elementFromPoint(msg.pageX, msg.pageY);

            if(this.lastEl && this.lastEl !== el) {
                if(this.lastEl.nodeName === 'IFRAME') {
                    this.eventing.publish(Constants.DRAG_OUT_CHANNEL, null, this.lastEl.id);
                }
                else {
                    this.fireMouseEvent(this.lastEl, 'mouseout', msg, el);
                    this.fireMouseEvent(el, 'mouseover', msg, this.lastEl);
                }
            }
            if(el && el.nodeName === 'IFRAME') {
                var elPos = $(el).offset();

                // convert container pageX and pageY to sending widget's pageX and pageY to 
                msg.pageX -= elPos.left;
                msg.pageY -= elPos.top;

                Comms.send(el.id, Constants.FIRE_MOUSE_MOVE_SERVICE_NAME, null, msg);
                this.hideDragIndicator();
            }
            else if(el){
                this.fireMouseEvent(el, 'mousemove', msg);
            }
            // update lastEl
            this.lastEl = el;
        },

        /**
         * @private
         *
         * Receives faked mouse up handlers and cancels the drag
         */
        commsMouseUpHandler: function(msg) {
            var senderObj = JSON.parse(msg.sender),
                iframeId = JSON.stringify({id:senderObj.id}),
                position = $(CommsContainer.getIframeEl(senderObj.id)).offset(),
                el;

            msg.pageX += position.left;
            msg.pageY += position.top;
            
            el = document.elementFromPoint(msg.pageX, msg.pageY);

            if(el.nodeName === 'IFRAME') {
                var elPos = $(el).offset();
                msg.pageX -= elPos.left;
                msg.pageY -= elPos.top;
                Comms.send(el.id, Constants.FIRE_MOUSE_UP_SERVICE_NAME, null, msg);
            }
            else {
                this.fireMouseEvent(el, 'mouseup', msg);
            }
            this.lastEl = null;
        },

        /**
         * @private
         *
         * Handler for when a drag stops in a widget. When this happens the data
         * payload of the drag needs to be sent to the widget, and other widgets need
         * to be notified that the drag has stopped. Also fires any registered
         * dragStop callbacks
         *
         * @param sender the iframe id of the sending widget
         * @param msg the msg sent from that widget
         */
        dragStoppedInWidget: function(sender, msg) {
            this.hideDragIndicator();

            this.detachMouseListeners();

            //actually send data
            this.eventing.publish(Constants.DROP_RECEIVE_DATA_CHANNEL,
                    this.dragDropData, sender);

            // Publish event to let widgets know that the mouse button was released
            this.eventing.publish(Constants.DRAG_STOP_IN_CONTAINER_CHANNEL, null);

            this.dragging = false;

            this.callbacks.dragStop.fire(msg);
        },

        /**
         * @private
         *
         * Sets the drag data
         */
        setData: function(sender, data) {
            this.dragDropData = data;
        },

        /**
         * @private
         *
         * Sets additional channels to listen to, in addition to those configured
         * by the superclass
         */
        initChannels: function() {
            DragnDropBase.prototype.initChannels.call(this);

            this.eventing.subscribe(Constants.DRAG_STOP_IN_WIDGET_CHANNEL, 
                    $.proxy(this.dragStoppedInWidget, this));
            this.eventing.subscribe(Constants.DRAG_SEND_DATA_CHANNEL,
                    $.proxy(this.setData, this));
        },

        /**
         * @private
         *
         * mouseup handler that detaches mouse listeners, publishes a drag stop
         * to widgets, and fires dragStop callbacks
         */
        mouseUp: function() {
            DragnDropBase.prototype.mouseUp.call(this);
            this.detachMouseListeners();

            // Publish event to let widgets know that the mouse button was released
            this.eventing.publish(Constants.DRAG_STOP_IN_CONTAINER_CHANNEL, null);

            this.callbacks.dragStop.fire();
        },

        /**
         * @private
         *
         * mouseout handler that tracks when the mouse enters or leaves a widget
         */
        mouseOut : function(e) {
            var dest = e.toElement || e.relatedTarget;

            if (!dest) {
                //moused out of the entire page
                return;
            }

            this.overIframe = (dest.nodeName === 'IFRAME');

            //check if moving into or out of widget
            if (this.overIframe || e.target.nodeName === 'IFRAME') {

                // Mouse cursor is moving into the desktop or another widget,
                //  so we send an event informing widgets of this
                this.eventing.publish(Constants.DRAG_OUT_CHANNEL, null);
            }
        },

        /**
         * @private
         *
         * mousemove handler that keeps track of the drag proxy
         * that follows the mouse around
         */
        mouseMove : function(e) {
            var clientWidth = null,
                clientHeight = null,
                leftWidth = e.pageX,
                topHeight = e.pageY,
                dragIndicatorCss = {display: 'block'};

            if (this.overIframe) {
                return;
            }

            // flipping mechanism when the cursor reaches the right or bottom edge of the widget
            dragIndicatorCss.top = topHeight + 19 + "px";

            if (window.innWidth) {
                clientWidth = window.innerWidth;
                clientHeight = window.innerHeight;
            }
            else {
                clientWidth = document.body.clientWidth;
                clientHeight = document.body.clientHeight;
            }

            var rightLimit = clientWidth - 100;
            if ((leftWidth < clientWidth) && (leftWidth > rightLimit)) {
                dragIndicatorCss.left = leftWidth - 88 + "px";
            }
            else {
                dragIndicatorCss.left = leftWidth + 12 + "px";
            }
            var bottomLimit = clientHeight - 45;
            if ((topHeight > bottomLimit) && (topHeight < clientHeight)) {
                dragIndicatorCss.top = topHeight - 30 + "px";
            }

            this.dragIndicator.css(dragIndicatorCss);
        },

        /**
         * @private
         *
         * Attaches mouse listeners.  In addition to those attached by the superclass, also
         * listens for mouseOut
         */
        attachMouseListeners: function() {
            $(document).on('mouseout', $.proxy(this.mouseOut, this));

            DragnDropBase.prototype.attachMouseListeners.call(this);
        },

        /**
         * @private
         *
         * Detaches mouse listeners attached by attachMouseListeners
         */
        detachMouseListeners: function() {
            $(document).off('mouseout', $.proxy(this.mouseOut, this));

            DragnDropBase.prototype.detachMouseListeners.call(this);
        },

        /**
         * @private
         *
         * registers handlers for fake mouse events. Registers for mouseout in addition to
         * the events that the superclass registers for
         */
        initMouseEventComms: function() {
            this.comms.register(Constants.FAKE_MOUSE_UP_SERVICE_NAME, 
                    $.proxy(this.commsMouseUpHandler, this));
            this.comms.register(Constants.FAKE_MOUSE_MOVE_SERVICE_NAME, 
                    $.proxy(this.commsMouseMoveHandler, this));
            this.comms.register(Constants.FAKE_MOUSE_OUT_SERVICE_NAME, 
                    $.proxy(this.hideDragIndicator, this));
        },

        /**
         * Unregisters all pubsub channels and rpc services
         */
        destroy: function() {
            this.eventing.unsubscribe(Constants.DRAG_START_CHANNEL);
            this.eventing.unsubscribe(Constants.DRAG_STOP_IN_WIDGET_CHANNEL);
            this.eventing.unsubscribe(Constants.DRAG_SEND_DATA_CHANNEL);
            this.eventing.unsubscribe(Constants.DRAG_OUT_CHANNEL);

            this.comms.unregister(Constants.FAKE_MOUSE_MOVE_SERVICE_NAME);
            this.comms.unregister(Constants.FAKE_MOUSE_OUT_SERVICE_NAME);
            this.comms.unregister(Constants.FAKE_MOUSE_UP_SERVICE_NAME);

            _.each(this.callbacks, function(cb) {
                cb.empty();
            });           
        }
    });

    return new DragnDropContainer(EventingContainer, Comms);
});
