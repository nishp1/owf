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
    'views/list/List',
    'views/dashboardswitcher/Tiles',
    'events/EventBus',
    // Libraries.
    'jquery',
    'lodash',
    'handlebars',
    'require'
],

function(List, Tiles, EventBus, $, _, Handlebars, require) {

    'use strict';

    return List.extend({

        className: 'stack-dashboards-view',

        template:   '<div class="stack-dashboards-anchor-tip"></div>',

        modelEvents: {
            'change': 'render',
            'remove': 'remove',
            'destroy': 'remove'
        },

        render: function () {
            var me = this;

            this.$el
                .html( this.template );

            this.tiles = this.addView({
                vtype: 'dashboardswitcher.tiles',
                collection: this.collection
            });

            this.listenTo(this.tiles, 'dashboard:click', function (model) {
               me.trigger('dashboard:click', model);
            });
            this.listenTo(this.tiles, 'dashboard:restore', function (model) {
                me.trigger('dashboard:restore', model);
            });
            this.listenTo(this.tiles, 'dashboard:edit', function (model) {
                me.trigger('dashboard:edit', model);
            });
            this.listenTo(this.tiles, 'dashboard:share', function (model) {
                me.trigger('dashboard:share', model);
            });
            this.listenTo(this.tiles, 'dashboard:delete', function (model) {
                me.trigger('dashboard:delete', model);
            });
            this.listenTo(this.tiles, 'tiles:actionsshown', function (model) {
                me.trigger('tiles:actionsshown', model);
            });
            this.listenTo(this.tiles, 'tiles:actionshidden', function (model) {
                me.trigger('tiles:actionshidden', model);
            });
            return this;
        },

        toggleManage: function () {
            this.tiles && this.tiles.toggleManage();
        },

        clearSelection: function () {
            this.tiles && this.tiles.clearSelection();
        },

        isManaging: function () {
            return (this.tiles ? this.tiles.isManaging() : false);
        }
    });
});
