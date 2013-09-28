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

;(function(OWF, $, window, document) {
    'use strict';
    var DD,
        Base = OWF.DragAndDrop.Base;
    
    //internal constructor in order to subclass DragnDropBase
    function DragnDropWidget() {
        Base.apply(this, arguments);

        this.dropZoneHandlers = [];
    }

    DragnDropWidget.prototype = $.extend(new Base(), {
        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @field
         * @description dragStart is the name of the event when a drag is started.  Use 'dragStart' with the addCallback function
         * to add a callback function when a dragStart event occurs
         * @see <a href="#addCallback">addCallback</a>
         * @example
         *
         *  //this.wdd is a initialized WidgetDragAndDrop object
         *  this.wdd.addCallback('dragStart',function() {
         *    //use this function to change styles or change state when a drag is initiated
         *    cmp.dragging = true;
         *    cmp.getView().scroller.addCls('ddOver');
         *  });
         *
         */
        dragStart: 'dragStart',

        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @field
         * @description dragStop is the name of the event when a drag is stopped.  Use 
         * 'dragStop' with the addCallback function
         * to add a callback function when a dragStop event occurs
         * @see <a href="#addCallback">addCallback</a>
         * @example
         *
         *  //this.wdd is a initialized WidgetDragAndDrop object
         *  this.wdd.addCallback('dragStop',function() {
         *    //use this function to change styles or change state when a drag is stopped
         *    cmp.dragging = false;
         *    cmp.getView().scroller.removeCls('ddOver');
         *  });
         *
         */
        dragStop: 'dragStop',

        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @field
         * @description dropReceive is the name of the event when a drop occurs on this widget.  
         * This event indicates a successful drag and drop and data will be passed to the 
         * callback function.  Use 'dropReceive' with the addCallback function
         * to add a callback function when a dropReceive event occurs.  This callback function 
         * for this event will be called for all successful drops.  To support multiple drop 
         * zones use <a href="#addDropZoneHandler">addDropZoneHandler</a>
         * @see <a href="#addCallback">addCallback</a>
         * @example
         *
         *  //this.wdd is a initialized WidgetDragAndDrop object
         *   this.wdd.addCallback('dropReceive',function(msg) {
         *      //msg.dragDropData contains the data - this example the data is a channel name that will be subscribed to
         *      this.subscribeToChannel(msg.dragDropData);
         *   }.bind(this));
         */
        dropReceive: 'dropReceive',

        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @field
         * @description version number
         */
        version: OWF.Version.owfversion + OWF.Version.dragAndDrop,

        /**
         * @private
         * Subscribe to the necessary channels for drag and drop
         */
        initChannels: function() {
            Base.prototype.initChannels.call(this);

            OWF.Eventing.subscribe(OWF.Comms.Constants.DRAG_STOP_IN_CONTAINER_CHANNEL, 
                    $.proxy(this.onDragStopInContainer, this));
            OWF.Eventing.subscribe(OWF.Comms.Constants.DROP_RECEIVE_DATA_CHANNEL, 
                    $.proxy(this.onDropReceiveData, this));
        },

        /**
         * @private
         *
         * Set up internal rpc registrations for faked mouse events.  Faked mouse events
         * are necessary for flash widget and for Firefox 4+
         */
        initMouseEventComms: function() {
            this.comms.register(OWF.Comms.Constants.FIRE_MOUSE_UP_SERVICE_NAME, 
                    $.proxy(this.commsMouseUpHandler, this));
            this.comms.register(OWF.Comms.Constants.FIRE_MOUSE_MOVE_SERVICE_NAME, 
                    $.proxy(this.commsMouseMoveHandler, this));
        },


        /**
         * @private
         * A handler for fake mouse moves that dispatches the correct events
         */
        commsMouseMoveHandler: function(msg) {
            var el = document.elementFromPoint(msg.pageX, msg.pageY);

            if(this.getFlashWidgetId()) {
                if(msg.sender !== OWF.getIframeId()) {
                    OWF.Util.getFlashApp().dispatchExternalMouseEvent(msg.pageX, 
                        msg.pageY);
                }
                this.mouseMove(msg, true);
            }
            else {
                if(!this.lastEl) {
                    this.lastEl = el;
                    this.fireMouseEvent(el, 'mouseover', msg);
                }
                else if(this.lastEl !== el) {
                    this.fireMouseEvent(this.lastEl, 
                            'mouseout', msg);
                    this.fireMouseEvent(el, 'mouseover', msg);
                    this.lastEl = el;
                }

                this.fireMouseEvent(el, 'mousemove', msg);
            }
        },
        
        /**
         * @private
         * handler for mouseup events that have been faked and received over rpc.
         */
        commsMouseUpHandler: function(msg) {
            var el = document.elementFromPoint(msg.pageX, msg.pageY);
            if(el && el.nodeName === 'OBJECT') {
                this.mouseUp(msg, true);
            }
            else {
                this.fireMouseEvent(el, 'mouseup', msg);
            }
        },

        /**
         * @private
         * Handler for mousemove events. Keeps the drag proxy position up to date
         * and fires fake events to the container if necessary
         */
        mouseMove : function(e, fake) {
            var dragIndicatorCss = {};

            //only show the indicator if we are currenlty dragging
            if (!this.dragging) {
                return;
            }

            // if this is a flex widget, and event is not faked,
            // fake mouse events as soon as the drag starts
            if(this.getFlashWidgetId() && fake !== true) {
                OWF.Comms.send('..', OWF.Comms.Constants.FAKE_MOUSE_MOVE_SERVICE_NAME, null, {
                    sender: OWF.getIframeId(),
                    pageX: e.pageX,
                    pageY: e.pageY,
                    screenX: e.screenX,
                    screenY: e.screenY
                });
                return;
            }

            var clientWidth = null;
            var clientHeight = null;
            var leftWidth = e.pageX;
            var topHeight = e.pageY;

//            // Hide the drag indicator box while we move it
//            this.hideDragIndicator();

            if (e === undefined) {
                e = window.event;
            }

            if (window.innerWidth) {
                clientWidth = window.innerWidth;
                clientHeight = window.innerHeight;
            }
            else {
                clientWidth = document.body.clientWidth;
                clientHeight = document.body.clientHeight;
            }

            if(this.isFF4Plus() || this.getFlashWidgetId()) {

                if(e.clientX < 0 || e.clientX > clientWidth || 
                e.clientY < 0 || e.clientY > clientHeight) {

                    // set variable on function to keep track if we faked an event
                    // so that we can fake mouseout later when mouseover the current widget
                    if(!this.mouseMove._fakeEventCounter) {
                        this.mouseMove._fakeEventCounter = 1;
                    }
                    else {
                        this.mouseMove._fakeEventCounter += 1;
                    }

                    OWF.Comms.send('..', OWF.Comms.Constants.FAKE_MOUSE_MOVE_SERVICE_NAME, null, {
                        sender: OWF.getIframeId(),
                        pageX: e.pageX,
                        pageY: e.pageY,
                        screenX: e.screenX,
                        screenY: e.screenY
                    });
                    return;
                }
                else if( this.mouseMove._fakeEventCounter ) {
                    // we had faked a mousemove event before
                    // now fake mouseout event on the container
                    this.mouseMove._fakeEventCounter = null;
                    OWF.Comms.send('..', OWF.Comms.Constants.FAKE_MOUSE_OUT_SERVICE_NAME);
                }
            }

            // flipping mechanism when the cursor reaches the right or bottom 
            // edge of the widget
            dragIndicatorCss.display = 'block';
            dragIndicatorCss.top = topHeight + 19 + "px";

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

    //        // set text on indicator
    //        dragIndicatorText.text(dragIndicatorText);

            this.dragIndicator.css(dragIndicatorCss);
        },

        /**
         * @private
         * Handler for when a drag stops in the container, in which case we remove
         * all drag state
         */
        onDragStopInContainer: function(sender, msg) {
            this.hideDragIndicator();

            this.detachMouseListeners();

            this.dragging = false;
            this.dragStartData = null;
            this.dragStartZone = null;
            this.setDropEnabled(false);

            this.fireCallbacks('dragStop', [this.dropTarget]);
        },

        /**
         * @private
         * Handler for mouseup events.  Stops the drag, sends a fake mouseup event
         * if necessary, and notifies other widgets that the drag has stopped
         */
        mouseUp: function(e, fake) {
            if (!this.dragging) {
                return;
            }

            Base.prototype.mouseUp.call(this);

            if(this.getFlashWidgetId()) {

                var clientWidth = null;
                var clientHeight = null;

                if (window.innerWidth) {
                    clientWidth = window.innerWidth;
                    clientHeight = window.innerHeight;
                }
                else {
                    clientWidth = document.body.clientWidth;
                    clientHeight = document.body.clientHeight;
                }

                if((e.clientX < 0 || e.clientX > clientWidth || 
                    e.clientY < 0 || e.clientY > clientHeight) &&
                    fake !== true) {

                    OWF.Comms.send('..', OWF.Comms.Constants.FAKE_MOUSE_UP_SERVICE_NAME, null, {
                        sender: OWF.getIframeId(),
                        pageX: e.pageX,
                        pageY: e.pageY,
                        screenX: e.screenX,
                        screenY: e.screenY
                    });
                    return;
                }
            }

            this.detachMouseListeners();
            
            //save dropzone info
            this.dropTarget = e.target;

            //send message
            OWF.Eventing.publish(OWF.Comms.Constants.DRAG_STOP_IN_WIDGET_CHANNEL, 
                    OWF.getIframeId());

        },

        /**
         * @private
         * Handler for receiving the drag data when a drop occurs. Looks
         * through the drop zone handlers to find the correct handler for the drop,
         * and calls drop handler added via addCallback
         */
        onDropReceiveData: function(sender, msg) {
            var $target,
                matchingDropZones,
                me = this;

            //only if the mouse is over a drop zone
            if (me.dropEnabledFlag) {
                if (me.dropTarget) {
                    $target = $(me.dropTarget);

                    msg.dropTarget = me.dropTarget;

                    //search for matching dropZoneHandlers for the current dropTarget
                    matchingDropZones = $.grep(me.dropZoneHandlers, function(dropZoneHandler) {
                        return (
                            //compare id
                            ($target[0].id && $target[0].id === dropZoneHandler.id) ||

                            //compare css class
                            ($target.hasClass(dropZoneHandler.className)) ||

                            //if dropZoneHandler.dropZone is set, check
                            //for containment/equality
                            (dropZoneHandler.dropZone && 
                                ($.contains(dropZoneHandler.dropZone, $target[0]) ||
                                 dropZoneHandler.dropZone === $target[0])
                            ) 
                        //do not fire events if src and dest are the same
                        ) && me.dragStartZone !== dropZoneHandler.dropZone;
                    });

                    //execute the handler for each matching dropzone
                    $.each(matchingDropZones, function(idx, dropZone) {
                        dropZone.handler(msg);
                    });

                    //clear dropTarget because the drop is over
                    me.dropTarget = null;
                }

                me.fireCallbacks('dropReceive', [msg]);
            }
        },


        /**
         * Use this method to set flex dom element id, so that drag and drop can be 
         * enabled in flex widgets. 
         * @methodOf OWF.DragAndDrop
         * @name setFlashWidgetId
         *
         * @param {String} id dom element id of flex widget
         */
        setFlashWidgetId: function(id) {
            this.flashWidgetId = id;
        },

        /**
         * @private
         * retrieve the flash widget id set using setFlashWidgetId
         */
        getFlashWidgetId: function(id) {
            return this.flashWidgetId;
        },

        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @description Starts a drag.  The config object passed in describes the drag and 
         *  contains the data to be passed to the drop.
         * @param {Object} cfg config object see below
         * @param {String} cfg.dragDropLabel Name to be used as text for the dragDrop indicator
         * @param {Object} cfg.dragDropData Data to be sent on a successful drag and drop.  This 
         *  property is only sent to the
         * successful recipient of the drag (the dropReceive event).  It will not be sent for 
         *  other events.
         * @param {Object} cfg.dragZone dom node which presents a dragZone which is associated 
         *  with this drag.  This property is
         * only saved and used locally to the widget to identify whether a dragZone is in fact 
         *  the node as a dropZone.  It will not be
         * sent to other events callbacks.
         * @param {Object} cfg.* other custom properties may be specified, these will be passed 
         *  along to event handlers
         * @example
         *
         *  //add handler to text field for dragging
         *  var scope = this;
         *  document.getElementById('dragSource').addEventListener('mousedown',function(e) {
         *      e.preventDefault();
         *      var data = document.getElementById('InputChannel').value;
         *      if (data != null && data != '') {
         *        scope.wdd.doStartDrag({
         *            dragDropLabel: data,
         *            dragZone:  document.getElementById('dragZone'),
         *            dragDropGroup: 'location',  //extra property to pass along
         *            dragDropData: data
         *        });
         *      }
         *  }, false);
         */
        doStartDrag: function(cfg) {
            //do this as early as possible to minimize possibility of selection in IE7
            this.setGlobalSelectionEnabled(false);

            var dragStartCfg = $.extend({dragSourceId: OWF.getIframeId()}, cfg),
                filteredDragStartCfg = $.extend({}, dragStartCfg);

            this.dragStartZone = cfg.dragZone;

            delete filteredDragStartCfg.dragDropData;
            delete filteredDragStartCfg.dragZone;

            //Alert other widgets, including ourself, that a drag has started
            OWF.Eventing.publish(OWF.Comms.Constants.DRAG_START_CHANNEL, filteredDragStartCfg);

            //send the full data to the container ONLY
            OWF.Eventing.publish(OWF.Comms.Constants.DRAG_SEND_DATA_CHANNEL, dragStartCfg, '..');
        },


        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @name addDropZoneHandler
         * @description Adds a new drop zone to be managed.  The handler function defined 
         *   in the cfg object will be called when a drop occurs over a dom node which 
         *   matches the id or the className or is equal to or a child of the dropTarget node
         * @see doStartDrag
         * @param {Object} cfg config object see below
         * @param {className} cfg.className class of the dropZone
         * @param {String} cfg.id Id of the dropZone
         * @param {Node} cfg.dropZone HTML node which represents the dropZone
         * @param {Function} cfg.handler function to be called when a drop occurs over 
         *   the dropZone.  A msg object will be passed in
         *
         * @example
         * //Example cfg Object
         * {
         *  id: 'mygrid-1',
         *  className: 'mygridClass',
         *  dropZone: document.getElementById('dropZone'),
         *  handler: function(msg) {
         *    //some code here to handle the msg and respond
         *  }
         * }
         *
         * //Example usage of addDropZoneHandler which handles a drop that occurs over an 
         * //Ext Grid and inserts new data into that grid based on the dragged data
         * //this.wdd is the WidgetDragAndDrop Object
         * this.wdd.addDropZoneHandler({
         *   //dom node of an Ext grid
         *   dropZone:grid.getView().scroller.dom,
         *
         *   //this function is called only when a drop occurs over the grid (i.e. the 
         *   //mouse was released over the grid)
         *   handler: (function(msg){
         *
         *     var store = grid.getStore();
         *     var processedSelections = [];
         *     var errorMsg = null;
         *
         *     //loop through msg.dragDropData which is an array and check 
         *     //for dupes versus the destination store
         *     for (var i = 0; i < msg.dragDropData.length; i++) {
         *       //get data for one possible new record in the dragDropData
         *       var recData = msg.dragDropData[i];
         *
         *       //is it already in the dest Ext Store?
         *       if (store.findExact('id',recData.id) >= 0) {
         *         //found the record already in the store
         *       }
         *       else {
         *         //add new record based on the dragDropData
         *         var newRec = new store.recordType(recData);
         *         //calling an external function to decide whether to add the new rec
         *         var rs = displayPanel.validateRecordOnAdd(newRec);
         *         if (rs.success) {
         *           processedSelections.push(newRec);
         *         }
         *         else {
         *           errorMsg = rs.msg;
         *         }
         *       }
         *     }
         *
         *     if (errorMsg) {
         *       Ext.Msg.alert('Error', errorMsg);
         *     }
         *
         *     //actually insert into the store which adds it the new recs to the grid
         *     if (processedSelections.length > 0) {
         *       store.insert(0, processedSelections);
         *     }
         *
         * }).createDelegate(grid)});   //createDelegate is an Ext function which 
         *                              //sets the scope of the callback
         *
         *
         */
        /**
         * @memberOf OWF.DragAndDrop
         * @name addDropZoneHandler
         * @description Adds a new drop zone to be managed.  The handler function defined 
         *   in the cfg object will be called when a drop occurs over a dom node which 
         *   matches the id or the className or is equal to or a child of the dropTarget node
         * @see startDrag
         * @param {Object} cfg config object see below
         * @param {className} cfg.className class of the dropZone
         * @param {String} cfg.id Id of the dropZone
         * @param {Node} cfg.dropZone HTML node which represents the dropZone
         * @param {Function} cfg.handler function to be called when a drop occurs over 
         *   the dropZone.  A msg object will be passed in
         *
         * @example
         * //Example cfg Object
         * {
         *  id: 'mygrid-1',
         *  className: 'mygridClass',
         *  dropZone: document.getElementById('dropZone'),
         *  handler: function(msg) {
         *    //some code here to handle the msg and respond
         *  }
         * }
         *
         * //Example usage of addDropZoneHandler which handles a drop that occurs over an 
         * //Ext Grid and inserts new data into that grid based on the dragged data
         * OWF.DragAndDrop.addDropZoneHandler({
         *   //dom node of an Ext grid
         *   dropZone:grid.getView().scroller.dom,
         *
         *   //this function is called only when a drop occurs over the grid (i.e. the 
         *   //mouse was released over the grid)
         *   handler: (function(msg){
         *
         *     var store = grid.getStore();
         *     var processedSelections = [];
         *     var errorMsg = null;
         *
         *     //loop through msg.dragDropData which is an array and check 
         *     //for dupes versus the destination store
         *     for (var i = 0; i < msg.dragDropData.length; i++) {
         *       //get data for one possible new record in the dragDropData
         *       var recData = msg.dragDropData[i];
         *
         *       //is it already in the dest Ext Store?
         *       if (store.findExact('id',recData.id) >= 0) {
         *         //found the record already in the store
         *       }
         *       else {
         *         //add new record based on the dragDropData
         *         var newRec = new store.recordType(recData);
         *         //calling an external function to decide whether to add the new rec
         *         var rs = displayPanel.validateRecordOnAdd(newRec);
         *         if (rs.success) {
         *           processedSelections.push(newRec);
         *         }
         *         else {
         *           errorMsg = rs.msg;
         *         }
         *       }
         *     }
         *
         *     if (errorMsg) {
         *       Ext.Msg.alert('Error', errorMsg);
         *     }
         *
         *     //actually insert into the store which adds it the new recs to the grid
         *     if (processedSelections.length > 0) {
         *       store.insert(0, processedSelections);
         *     }
         *
         * }).createDelegate(grid)});   //createDelegate is an Ext function which 
         *                              //sets the scope of the callback
         *
         *
         */
        addDropZoneHandler: function(cfg) {
            this.dropZoneHandlers.push(cfg);
        },
        
        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @name getDropEnabled
         * @description returns whether the a drop is enabled 
         * (this is only true when the mouse is over a drop zone)
         */
        /**
         * @memberOf OWF.DragAndDrop
         * @name getDropEnabled
         * @description returns whether the a drop is enabled 
         * (this is only true when the mouse is over a drop zone)
         */
        getDropEnabled : function() {
            return this.dropEnabledFlag;
        },

        /**
         * @memberOf OWF.DragAndDrop
         * @name getDragStartData
         * @description returns data sent when a drag was started
         */
        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @name getDragStartData
         * @description returns data sent when a drag was started
         */
        getDragStartData : function() {
            return $.extend({dragZone: this.dragStartZone}, this.dragStartData);
        },

        /**
         * @memberOf Ozone.dragAndDrop.WidgetDragAndDrop.prototype
         * @name setDropEnabled
         * @description toggles the dragIndicator to indicate successful or unsuccessful drop
         * @param {Boolean} dropEnabled true to enable a drop, false to indicate a unsuccessful 
         * drop
         * @example
         *
         *  //attach mouseover callback to a particular area. If the mouse is here allow a drop
         *  cmp.getView().scroller.on('mouseover',function(e,t,o) {
         *    if (cmp.dragging) {
         *      this.wdd.setDropEnabled(true);
         *    }
         *  },this);
         *
         *  //attach a mouse out callback to a particular area. If the mouse leaves disable drop
         *  cmp.getView().scroller.on('mouseout',function(e,t,o) {
         *    if (cmp.dragging) {
         *      this.wdd.setDropEnabled(false);
         *    }
         *  },this);
         */
        /**
         * @memberOf OWF.DragAndDrop
         * @name setDropEnabled
         * @description toggles the dragIndicator to indicate successful or unsuccessful drop
         * @param {Boolean} dropEnabled true to enable a drop, false to indicate a unsuccessful 
         * drop
         * @example
         *
         *  //attach mouseover callback to a particular area. If the mouse is here allow a drop
         *  cmp.getView().scroller.on('mouseover',function(e,t,o) {
         *    if (cmp.dragging) {
         *      OWF.DragAndDrop.setDropEnabled(true);
         *    }
         *  },this);
         *
         *  //attach a mouse out callback to a particular area. If the mouse leaves disable drop
         *  cmp.getView().scroller.on('mouseout',function(e,t,o) {
         *    if (cmp.dragging) {
         *      OWF.DragAndDrop.setDropEnabled(false);
         *    }
         *  },this);
         */
        setDropEnabled: function(dropEnabled) {
            if (dropEnabled) {
                this.dropEnabledFlag = true;
                this.dragIndicator.removeClass('ddBoxCannotDrop');
                this.dragIndicator.addClass('ddBoxCanDrop');
            }
            else {
                this.dropEnabledFlag = false;
                this.dragIndicator.removeClass('ddBoxCanDrop');
                this.dragIndicator.addClass('ddBoxCannotDrop');
            }
        },

        /**
         * Executes the callback passed when a drag starts in any widget.
         * @name onDragStart
         * @methodOf OWF.DragAndDrop
         * 
         * @param {Function} callback The function to execute as a callback.
         * @param {Object} scope The scope (this reference) in which the function is executed. 
         * If omitted, defaults to the browser window.
         *
         *
         * @example 
         * //example callback, highlights an Ext Grid when a drag occurs 
         * OWF.DragAndDrop.onDragStart(function(sender, msg) {
         *   //get the Ext Grid
         *   var grid = this.getComponent(this.gridId);
         *   //check custom dragDropGroup property to see if the drag is meant for this grid
         *   //if so highlight the grid by adding the ddOver class
         *   if (grid && msg != null && msg.dragDropGroup == 'users') {
         *       grid.getView().scroller.addClass('ddOver');
         *   } 
         * }, this);
         */
        onDragStart: function(callback, scope) {
            this.addCallback('dragStart', $.proxy(callback, scope));
            return this;
        },

        /**
         * Executes the callback passed when a drag stops in any widget.
         * @name onDragStop
         * @methodOf OWF.DragAndDrop
         * 
         * @param {Function} callback The function to execute as a callback.
         * @param {Object} scope The scope (this reference) in which the function is executed. 
         * If omitted, defaults to the browser window.
         * @example 
         * OWF.DragAndDrop.onDragStop(function(sender, msg) {
         *  // do something here
         * }, this);
         */
        onDragStop: function(callback, scope) {
            this.addCallback('dragStop', $.proxy(callback, scope));
            return this;
        },
        
        /**
         * Executes the callback passed when a drop occurs in the widget. 
         * If one has multiple dropZones in a widget it is easier to use 
         * <a href="#addDropZoneHandler">addDropZoneHandler</a>
         * @name onDrop
         * @methodOf OWF.DragAndDrop
         * 
         * @param {Function} callback The function to execute as a callback.
         * @param {Object} scope The scope (this reference) in which the function is executed. 
         * If omitted, defaults to the browser window.
         * @example
         * OWF.DragAndDrop.onDrop(function(sender, msg) {
         *  var data = msg.dragDropData;
         * 
         *  // do something with the data here
         * }, this);
         */
        onDrop: function(callback, scope) {
            this.addCallback('dropReceive', $.proxy(callback, scope));
            return this;
        },
 
        /**
         *  Starts a drag.  The config object passed in describes the drag and contains the data 
         *  to be passed to the drop.
         *  @name startDrag
         *  @methodOf OWF.DragAndDrop
         *
         *  @param {Object} cfg config object see below
         *  @param {String} cfg.dragDropLabel Name to be used as text for the dragDrop indicator
         *  @param {Object} cfg.dragDropData Data to be sent on a successful drag and drop.  
         *  This property is only sent to the successful recipient of the drag 
         *  (the dropReceive event).  It will not be sent for other events.
         *  @param {Object} cfg.dragZone dom node which presents a dragZone which is associated 
         *  with this drag.  This property is only saved and used locally to the widget to 
         *  identify whether a dragZone is in fact the node as a dropZone.  It will not be
         *  sent to other events callbacks.
         *  @param {Object} cfg.* other custom properties may be specified, these will be 
         *  passed along to event handlers
         *  
         *  @example
         *  //add handler to text field for dragging
         *  document.getElementById('dragSource').addEventListener('mousedown', function(e) {
         *      e.preventDefault();
         *      var data = document.getElementById('InputChannel').value;
         *      if (data) {
         *          OWF.DragAndDrop.startDrag({
         *              dragDropLabel: data,
         *              dragDropData: data,
         *              dragZone:  document.getElementById('dragZone'),
         *              dragDropGroup: 'location'  //custom property to pass along
         *          });
         *      }
         *  });
         */
        startDrag: function(cfg) {
            this.doStartDrag(cfg);
            return this;
        }
    });

    DD = new DragnDropWidget(OWF.Eventing, OWF.Comms);

    //initialize drag and drop when eventing is ready
    OWF.ready(function() {
        //attach dragIndicator to DOM
        $(document.body).append(DD.dragIndicator);

        DD.init();
    });


    //set up "constructor" for pre-3.7 style API
    /**
     * @name WidgetDragAndDrop
     * @memberOf Ozone.dragAndDrop
     * @class
     * 
     * @deprecated Since OWF 3.7.0  You should use 
     * <a href="#.getInstance">Ozone.dragAndDrop.WidgetDragAndDrop.getInstance</a>
     * @constructor
     * @param {Object} cfg config object see below for properties
     * @param {Object} [cfg.callbacks]  Object with callbacks who's names match drag and drop 
     * events.  Alternatively one could
     * use the <a href="#addCallback">addCallback</a> function
     * @description The Ozone.dragAndDrop.WidgetDragAndDrop object manages the drag and drop for 
     * an individual widget.
     * @requires <a href="Ozone.eventing.Widget.html">Ozone.eventing.Widget</a> for eventing
     * @see <a href="#addCallback">addCallback</a>
     * @example
     *
     * var wdd = new Ozone.dragAndDrop.WidgetDragAndDrop({
     *     callbacks: { dragStart: function() {}}
     * });
     *
     */
    function LegacyConstructor(cfg) {
        if (cfg) {
            DD.addCallbacks(OWF.Util.filterAttrs(cfg.callbacks,
                    ['dragStart', 'dragStop', 'dropReceive']));
        }

        return DD;
    }

    //set up getInstance for 3.7 - 4.0 style API
    /**
     * @deprecated Since OWF 5.0 - Use OWF.DragAndDrop instead
     * @name getInstance
     * @methodOf Ozone.dragAndDrop.WidgetDragAndDrop
     * @static
     * @description Retrieves Ozone.dragAndDrop.WidgetDragAndDrop Singleton instance. 
     * Manages the drag and drop for an individual widget.
     * @param {Object} cfg config object see below for properties
     * @param {Object} [cfg.callbacks]  Object with callbacks who's names match drag and 
     * drop events.  Alternatively one could
     * use the <a href="#addCallback">addCallback</a> function
     * @requires <a href="Ozone.eventing.Widget.html">Ozone.eventing.Widget</a> for eventing
     * @see <a href="#addCallback">addCallback</a>
     * @example
     *
     * var wdd = Ozone.dragAndDrop.WidgetDragAndDrop.getInstance({
     *     callbacks: { dragStart: function() {}}
     * });
     */
    LegacyConstructor.getInstance = LegacyConstructor;

    //replace DragAndDrop and Base with the new object
    /**
     * @namespace
     */
    OWF.DragAndDrop = DD;

    //attach legacy APIs
    /**
     * @namespace
     * @name Ozone.dragAndDrop
     */
    window.Ozone = $.extend(true, window.Ozone, {
        dragAndDrop: { WidgetDragAndDrop: LegacyConstructor }
    });

})(window.OWF = window.OWF || {}, window._$, window, window.document);
