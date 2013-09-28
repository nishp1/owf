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
/*global define*/
define([
    'events/EventBus',
    'views/View',
    'views/dashboard/DashboardInstance',
    'models/DashboardInstance',
    'services/KeyboardManager',
    'comms/Constants',
    'jquery',
    'lodash'
], function (EventBus, View, DashboardInstance, DashboardInstanceModel, KeyboardManager, Constants, $, _) {
    'use strict';

    var KeyNavKeys = Constants.KeyNav.Keys,
        keynavEvents = {};

    keynavEvents[KeyNavKeys.NEXT_DASHBOARD] = '_nextDashboard';
    keynavEvents[KeyNavKeys.PREVIOUS_DASHBOARD] = '_previousDashboard';
    keynavEvents[KeyNavKeys.MINIMIZE_EXPAND_WIDGET] = '_expandMinimizeWidget';
    keynavEvents[KeyNavKeys.MAXIMIZE_COLLAPSE_WIDGET] = '_collapseMaximizeWidget';
    keynavEvents[KeyNavKeys.MOVE_UP] = '_moveUp';
    keynavEvents[KeyNavKeys.MOVE_DOWN] = '_moveDown';
    keynavEvents[KeyNavKeys.MOVE_LEFT] = '_moveLeft';
    keynavEvents[KeyNavKeys.MOVE_RIGHT] = '_moveRight';
    keynavEvents[KeyNavKeys.ESCAPE_FOCUS] = '_escapeFocus';

    return View.extend({

        rendered: false,
        el: $('#dashboard-container'),

        // active dashboard view
        activeDashboard: null,

        keynavEvents: keynavEvents,

        initialize: function () {
            this.activatedDashboards = {};

            this.listenTo(this.collection, 'destroy', _.bind(this._onDashboardDestroy, this));

            EventBus.on('launchMenu:launchWidgetStart', this.launchWidget, this);
            EventBus.on('dashboard:switch', this.activateDashboard, this);
            EventBus.on('dashboard:restore', this._onDashboardRestore, this);

            $(window).on('beforeunload', _.bind(this.save, this));

            View.prototype.initialize.apply(this, arguments);
        },

        render: function () {
            this.activateDashboard(this.collection.at(0));
            return this;
        },

        activateDashboard: function (model, options) {
            var dfd = $.Deferred(),
                me = this,
                index,
                dashboard,
                animate,
                rerender;
            
            options = options || {};
            animate = options.animate;
            rerender = options.rerender;

            // check if is a string/guid
            // if so, look up the model in dashboard collection
            if (_.isString(model)) {
                model = this.collection.get(model);
            }

            // verify model exists in collection
            index = this.collection.indexOf(model);

            // if no model found, pick first in collection
            model = model || this.collection.at(0);

            // if collection didn't have any models
            // create one
            if(!model) {
                //console.log('Creating a sample dashboard since none found');
                model = new DashboardInstanceModel();
                
                //Must be synchronous or the model will get out of sync
                this.collection.create(model, {async: false});
            }

            // rerender a dashboard
            dashboard = this.activatedDashboards[model.cid];

            if(rerender && dashboard) {
                delete this.activatedDashboards[model.cid];
                dashboard.remove();

                // to prevent hide from being called as it is already removed
                if(this.activeDashboard && this.activeDashboard.model === model) {
                    this.activeDashboard = null;
                }
            }

            if (this.activeDashboard) {
                // if this is the active dashboard return
                if (this.activeDashboard.model === model) {
                    //console.log('return current dashboard.....');
                    dfd.resolve(this.activeDashboard, model);
                    return dfd.promise();
                }
                else {
                    //console.log('hide dashboard.....', this.activeDashboard.model.get('name'));
                    this.activeDashboard.hide(animate);
                }
            }

            // dashboard rendered previously
            if (this.activatedDashboards[model.cid]) {
                this.activeDashboard = this.activatedDashboards[model.cid];
                //console.log('not rendering new dashboard.....');
            }
            // render a new dashboard
            else {
                //console.log('rendering new dashboard.....');
                this.activeDashboard = new DashboardInstance({
                    model: model
                });
                this.activatedDashboards[model.cid] = this.activeDashboard;
                this.$el.append(this.activeDashboard.render().el);
                this.activeDashboard.doPaneLayout();
            }

            // show the active dashboard

            //console.log('show...', this.activeDashboard.model.get('name'))
            document.title = model.get('name');
            this.activeDashboard.show(animate).then(function () {
                dfd.resolve(me.activatedDashboards[model.cid], model);
                EventBus.trigger('dashboard:switched', model);
            });

            return dfd.promise();
        },

        _onDashboardRestore: function (model, options) {

            console.log('handling restore in dash container.');

            var dashboard = null;

            // update cached layout config
            model.setLayoutConfig(model.get('layoutConfig'));

            // If this dashboard had been rendered, clear it.
            dashboard = this.activatedDashboards[model.cid];
            if (dashboard) {
                delete this.activatedDashboards[model.cid];
                dashboard.remove();
            }

            // if this is the active dashboard, rerender it.
            if (this.activeDashboard.model === model) {
                // Re-render it.
                this.activeDashboard = new DashboardInstance({
                    model: model
                });
                this.activatedDashboards[model.cid] = this.activeDashboard;
                this.$el.append(this.activeDashboard.render().el);
                this.activeDashboard.doPaneLayout();
            }
        },

        _onDashboardDestroy: function (model, collection, options) {
            var dashboard = this.activatedDashboards[model.cid];

            // remove dashboard view if found
            if(dashboard) {
                dashboard.remove();
                delete this.activatedDashboards[model.cid];
            }

            // activate first dashboard if currently 
            // active dashboard is removed
            if(this.activeDashboard.model === model) {
                this.activeDashboard = null;
                this.activateDashboard( this.collection.at(0) );
            }
        },

        launchWidget: function (model,opts) {
            return this.activeDashboard.launchWidget(model,opts).then(
                    //success
                    function (model, view) {
                        EventBus.trigger('launchMenu:launchWidgetSuccess', model, view);
                    },
                    //failure
                    function (model) {

                    }).
                    //always
                    always(function (model) {
                        EventBus.trigger('launchMenu:launchWidgetEnd');
                    });
        },

        /**
         * Returns an array of all the opened widgets on the active dashboard, including data
         * required for RPC API communication specifically.
         *
         * @returns {Array} An array of widget data objects
         */
        getOpenedWidgets: function () {
            return this.activeDashboard ? 
                        this.activeDashboard.getOpenedWidgets(this.options.personalWidgetDefinitionsCollection) :
                        [];
        },

        save: function (evt) {
            var isUnloading = (evt && (evt.type === 'beforeunload')),
                async = isUnloading ? false: true,
                dfd;

            if(this.activeDashboard) {
                dfd = this.activeDashboard.save({ async: async });
            }

            if(!isUnloading) {
                return dfd || $.Deferred().resolve();
            }
        },

        _nextDashboard: function () {
            console.log('activate next dashboard');
        },

        _previousDashboard: function () {
            console.log('activate previous dashboard');
        },

        _expandMinimizeWidget: function () {
            console.log('expand (accordion/portal) or minimize widget(desktop)');
        },

        _collapseMaximizeWidget: function () {
            console.log('collapse (accordion/portal) or maximize widget(desktop)');
        },

        _moveUp: function () {
            console.log('move the current focused widget up');
        },

        _moveDown: function () {
            console.log('move the current focused widget down');
        },

        _moveLeft: function () {
            console.log('move the current focused widget left');
        },

        _moveRight: function () {
            console.log('move the current focused widget right');
        },

        _escapeFocus: function () {
            console.log('focus widget title of the focused widget');
        }

    });

});
