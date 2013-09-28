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
    'views/panes/PanelPane',
    'views/widgets/Panel',
    'mixins/widgets/ResizableWidget',
    'backbone',
    'lodash'
], function (PanelPane, Panel, ResizableWidget, Backbone, _) {
    
    'use strict';

    var Portlet = Panel.extend(_.extend({}, ResizableWidget, {
        render: function() {
            Panel.prototype.render.apply(this, arguments);

            //allow only the south handle on the resizable plugin, effectively
            //disabling horizontal resize
            ResizableWidget.render.call(this, {handles: 's'}, false, true);

            return this;
        },

        //override onResize to unset width, and only record changes in height
        onResize: function(evt, ui) {
            this.$el.css('width', '');

            ui && this.model.set('height', ui.size.height);
        },

        updateCollapse: function() {
            Panel.prototype.updateCollapse.apply(this, arguments);

            //disable resize on collapsed widgets
            this[this.model.get('collapsed') ? 'disableResize' : 'enableResize']();
        }
    }));

    return PanelPane.extend(_.extend({}, {
        vtype: 'portalpane',

        className: PanelPane.prototype.className + ' portalpane',

        viewFactory: function(widget) {
            return new Portlet({
                model: widget
            });
        }
    }));

});
