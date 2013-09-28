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
    'events/EventBus',
    'models/WidgetState',
    'services/CommandManager',
    'util/containerUtil',
    'views/View',
    // Libraries.
    'jquery',
    'lodash'
], function (EventBus, WidgetState, CommandManager, ContainerUtil, View, $, _) {
    'use strict';

    return {
        widgetTypeMap: {},
        initialize: function (opts) {
            opts = opts || {};

            if (opts.toolbar != null && opts.personalWidgetDefinitions != null) {

                //do an initial scan to add any buttons
                this.updateExistsMap(opts.personalWidgetDefinitions);
                this.updateToolbar(opts.toolbar, opts.personalWidgetDefinitions);

                //bind to add event
                opts.personalWidgetDefinitions.on('add', function (model) {
                    this.updateExistsMap(opts.personalWidgetDefinitions);
                    this.updateToolbar(opts.toolbar, opts.personalWidgetDefinitions);
                }, this);

                //bind to remove event
                opts.personalWidgetDefinitions.on('remove', function (model) {
                    this.updateExistsMap(opts.personalWidgetDefinitions);
                    this.updateToolbar(opts.toolbar, opts.personalWidgetDefinitions);
                }, this);

                //bind to change:widgetType event
                opts.personalWidgetDefinitions.on('change:widgetType', function (model) {
                    this.updateExistsMap(opts.personalWidgetDefinitions);
                    this.updateToolbar(opts.toolbar, opts.personalWidgetDefinitions);
                }, this);
            }
        },
        updateExistsMap: function (collection) {
            this.widgetTypeMap = {};
            collection.forEach(function (pwd) {
                var widgetType = pwd.get('widgetType');
                if (widgetType != null) {
                    if (this.widgetTypeMap[widgetType] === undefined) {
                        this.widgetTypeMap[widgetType] = [];
                    }
                    this.widgetTypeMap[widgetType].push(pwd);
                }
            }, this);
        },
        updateToolbar: function (toolbar, personalWidgetDefinitions) {
            var me = this,
                mpButtonExists = toolbar.findView('marketplace-button');
//                metricButtonExists = toolbar.findView('metrics-button');

            if (this.widgetTypeMap.marketplace && !mpButtonExists) {
                toolbar.addMarketplaceButton({
                    events: {
                        'click': function (evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            if (me.widgetTypeMap.marketplace.length > 1) {
                                CommandManager.execute('command:toggleMarketplaceSettings', evt);
                            }
                            else {
                                //just launch the widget

                                //create a new id
                                var cloned = me.widgetTypeMap.marketplace[0].clone();
                                cloned.id = ContainerUtil.guid();
                                cloned.set('id', cloned.id);

                                //create a new wigetstatemodel
                                var widgetStateModel = WidgetState.createFromPersonalWidgetDefinition(cloned);

                                EventBus.trigger('launchMenu:launchWidgetStart', widgetStateModel);
                            }
                            return false;
                        }
                    }
                });
            }
            else if (!this.widgetTypeMap.marketplace && mpButtonExists) {
                toolbar.removeItem('marketplace-button');
            }

//            if (this.widgetTypeMap.metric && !metricButtonExists) {
//                toolbar.addMetricsButton();
//            }
//            else if (!this.widgetTypeMap.metric && metricButtonExists) {
//                toolbar.removeItem('metrics-button');
//            }
        }
    };
});