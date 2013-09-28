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
    'mixins/containers/SortableCollectionView',
    'jquery',
    'backbone',
    'lodash'
], function (PanelPane, Panel, SortableCollectionView, $, Backbone, _) {
    
    'use strict';

    return PanelPane.extend({
        vtype: 'accordionpane',

        className: PanelPane.prototype.className + ' accordionpane',

        modelEvents: _.extend({}, PanelPane.prototype.modelEvents, {
            'change:collapsed destroy': 'doLayout'
        }),

        afterRender: function() {
            PanelPane.prototype.afterRender.call(this);

            this.doLayout();
        },

        doLayout: function() {
            var me = this,
                paneHeight = me.$el.height();

            // TODO: Remove this if/else (keep if block's code) when doLayout of each pane is called on dashboard render.
            // If height is 0px pane hasn't been rendered to body yet
            if(paneHeight > 0) {
                PanelPane.prototype.doLayout.apply(me);

                var $widgets = me.$el.children('.widget'),
                    numCollapsed = $widgets.filter('.collapsed').length,
                    numExpanded = $widgets.length - numCollapsed,
                    headerHeight = $widgets.children('.header').outerHeight(true),
                    layoutHeight,
                    layoutPct,
                    headerPct,
                    expandedWidgetPct;

                // Get the height of a widget's margin, border, and padding, parseFloat to remove 'px'
                layoutHeight = (parseFloat($widgets.css("margin-top")) || 0) + (parseFloat($widgets.css("margin-bottom")) || 0) +
                    (parseFloat($widgets.css("border-top-width")) || 0) + (parseFloat($widgets.css("border-bottom-width")) || 0) +
                    (parseFloat($widgets.css("padding-top")) || 0) + (parseFloat($widgets.css("padding-bottom")) || 0);

                // Get the % height of the pane that a widget's layout takes up
                layoutPct = 100 * (layoutHeight / paneHeight);

                // Get the % height of the pane that a widget header takes up
                headerPct = 100 * (headerHeight / paneHeight);

                // Get the % height of the pane that an expanded widget should take up by dividing the total
                // % height the collapsed widgets and widget borders take up by the number of expanded widgets
                expandedWidgetPct = (100 - (numCollapsed * headerPct) - ($widgets.length * layoutPct)) / numExpanded;

                // Set the % height of all widgets, collapsed widgets will have their height overridden in css
                $widgets.css('height', expandedWidgetPct + '%');
            }
            else {
                // Not rendered, wait a bit and try again
                clearTimeout(me.id);
                me.id = setTimeout(function() { me.doLayout(); }, 0);
            }
        }
    });
});
