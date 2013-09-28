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
    'views/Modal',
    'views/list/WidgetTileList',
    'events/EventBus',
    'collections/PersonalWidgetDefinitions',
    // Libraries.
    'lodash'
], function (Modal, WidgetTileList, EventBus, PersonalWidgetDefinitions, _) {
    'use strict';

    return Modal.extend({
        id: 'launchMenu',
        className: 'modal hide fade',

        //this needs to be here to override the events from Modal.js - todo fix this
        events:  {
        },

        footer: false,
        removeOnClose: false,

        initialize: function () {
            Modal.prototype.initialize.apply(this, arguments);

            //filter the pwds to only standard widgets
            this.collection = new PersonalWidgetDefinitions(this.options.personalWidgetDefinitions.filter(function(model) {
                return model != null && model.get("widgetType") === 'standard';
            },this));

            //bind to add event
            this.options.personalWidgetDefinitions.on('add', function (model) {
                if (model.get("widgetType") === 'standard') {
                  this.collection.add(model);
                }
            }, this);

            //bind to remove event
            this.options.personalWidgetDefinitions.on('remove', function (model) {
                if (model.get("widgetType") === 'standard') {
                  this.collection.remove(model);
                }
            }, this);

            //bind to remove event
            this.options.personalWidgetDefinitions.on('change:widgetType', function (model) {
                if (model.get("widgetType") === 'standard') {
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

        show: function () {
            return Modal.prototype.show.call(this);
            // Fetch the latest pwds.
            // if (this.options.personalWidgetDefinitions) {
            //     this.options.personalWidgetDefinitions.fetch({update: true, remove: true});
            // }
        },

        launchWidget: function(model, opts) {
            this.hide().then(function () {
                EventBus.trigger('launchMenu:launchWidgetStart', model, opts);
            });
        }

    });
});