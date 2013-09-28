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

/**
 * Common logic for widgets that can be resized by the user.
 * This mixin is used by widget Windows and widget Portlets.
 *
 * Usage: Mix this object into your class' prototype and 
 * be sure to call ResizableWidget.render in your render method.
 */
define([
    'lodash',
    'jqueryui/jquery.ui.resizable'
], function(_, $) {
    'use strict';

    function disableResize() {
        /*jshint validthis:true */
        this.$el.resizable('disable');
    }

    function enableResize() {
        /*jshint validthis:true */
        this.$el.resizable('enable');
    }

    return {
        /**
         * @param resizableOpts Extra options to be passed
         * into the resizable plugin
         */
        render: function(resizableOpts, widthResizable, heightResizable) {

            this.initResizable(resizableOpts);

            if (widthResizable) {
                this.$el.css('width', this.model.get('width'));
            }
            if (heightResizable) {
                this.$el.css('height', this.model.get('height'));
            }

            //Once render is called and the resizable plugin
            //is initialized, we can hook up the functions that enable
            //and disable that plugin
            _.extend(this, {
                enableResize: enableResize,
                disableResize: disableResize
            });

            if (this.resizeDisabled) {
                this.disableResize();
            }
        },

        initResizable: function(resizableOpts) {
            this.$el.resizable(_.extend({}, resizableOpts, {
                containment: resizableOpts && resizableOpts.containment ? resizableOpts.containment : this.containment,
                minHeight: 200,
                minWidth: 200,
                handles: resizableOpts && resizableOpts.handles ? resizableOpts.handles : 'all'
            }));

            //Must be separate from resizable config or stopPropagation doesn't work
            this.$el.on('resize', _.bind(this.onResize, this));

            this.on('remove', function(view) {
                view.$el.resizable('destroy');
            });
        },

        onResize: function (evt, ui) {
            //Stop from spreading resize to container
            evt.stopPropagation();

            if(ui) { //Sometimes ui is undefined in IE7, check required
                this.model.set({
                    'height': ui.size.height,
                    'width': ui.size.width
                });
            }
        },

        //these functions save whether or not resize
        //should be disabled once it is initialized. Once 
        //render is called these are replaced with functions that
        //immediately disable or enable the plugin
        enableResize: function() {
            this.resizeDisabled = false;
        },

        disableResize: function() {
            this.resizeDisabled = true;
        }
    };
});
