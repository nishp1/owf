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
    'views/panes/LayoutPane',
    'views/widgets/Window',
    'views/Taskbar',
    'views/widgets/WindowHeader',
    'services/ZIndexManager',
    'mixins/dashboard/ConstrainWidgets',
    'jquery',
    'backbone',
    'lodash'
], function (LayoutPane, WidgetWindow, Taskbar, WindowHeader, ZIndexManager, ConstrainWidgets, $, Backbone, _) {
    
    'use strict';

    return LayoutPane.extend(_.extend({}, ConstrainWidgets, {
        vtype: 'desktoppane',

        $body: null, //jquery element for the dashboard body
        taskbar: null, //taskbar View

        className: LayoutPane.prototype.className + ' desktoppane',

        modelDefaults: {
            "height": 200,
            "width": 200,
            "x": 0,
            "y": 0
        },

        initialize: function() {
            var me = this;

            this.zIndexManager = new ZIndexManager();

            me.$renderCollectionBody = me.$body = $('<div class="body">');

            LayoutPane.prototype.initialize.apply(this, arguments);

        },

        viewFactory: function (model) {
            return new WidgetWindow({
                model: model,
                containment: this.$body,
                zIndexManager:this.zIndexManager
            });
        },

        render: function () {
            var me = this;

            me.renderTaskbar();
            me.$el.append(me.$body);

            return LayoutPane.prototype.render.call(me);
        },

        renderTaskbar: function() {
            this.taskbar = new Taskbar({
                collection: this.collection,
                HeaderClass: WindowHeader
            });

            this.taskbar.render();
            this.$el.append(this.taskbar.$el);
        },

        doLayout: function() {
            LayoutPane.prototype.doLayout.call(this);
            this.taskbar.doLayout();
            this.adjustHiddenHeaders(this.$body);
        },

        changeActivation: function (widget) {
            var active = widget.get('active');

            if (active) {

                //bring active widget to front
                if (this.itemViewMap[widget.cid] != null) {
                  this.zIndexManager.bringToFront(this.itemViewMap[widget.cid]);
                }

                //deactivate all other widgets
                this.collection.each(function (widg) {
                    if (widget !== widg) {
                        widg.set('active', false);
                    }
                });
            }
        }
    }));
});