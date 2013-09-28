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
    'collections/PersonalWidgetDefinitions',
    'views/Modal',
    'views/list/WidgetTileList',
    'views/list/WidgetTile',
    'events/EventBus',
    // Libraries.
    'lodash'
], function (PersonalWidgetDefinitions, Modal, WidgetTileList, WidgetTile, EventBus, _) {
    'use strict';

    return Modal.extend({
        className: 'modal hide fade',
        events:  {
        },

        removeOnClose: false,

        initialize: function () {

            //filter
            this.collection = new PersonalWidgetDefinitions(this.collection.filter(function(model) {
                return this.options.modelFilter(model);
            },this));

            //bind to add event
            this.collection.on('add', function (model) {
                if (this.options.modelFilter(model)) {
                  this.collection.add(model);
                }
            }, this);

            //bind to remove event
            this.collection.on('remove', function (model) {
                if (this.options.modelFilter(model)) {
                  this.collection.remove(model);
                }
            }, this);

            //bind to change:widgetType event
            this.collection.on('change:widgetType', function (model) {
                if (this.options.modelFilter(model)) {
                  this.collection.add(model);
                }
                else {
                    this.collection.remove(model);
                }
            }, this);


            this.tiles = new WidgetTileList({
                collection: this.collection
            });

            this.listenTo(this.tiles, {
                'launchMenu:launchWidgetStart': _.bind(this.launchWidget, this)
            });

        },
        render: function () {
            Modal.prototype.render.call(this);
            this.$body.html(this.tiles.render().$el);
            return this;
        },

        launchWidget: function(model, opts) {
            this.hide().then(function () {
                EventBus.trigger('launchMenu:launchWidgetStart', model, opts);
            });
        }
    });
});