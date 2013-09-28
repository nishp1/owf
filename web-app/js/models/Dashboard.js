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
    'models/Model',
    'collections/WidgetStates',
    'lodash'
],

function(Model, WidgetStates, _) {
    'use strict';

    var Dashboard = Model.extend({

        fields: [
            'name',
            'description',
            'position',
            'created',
            'lastModified',
            'createdBy',
            'lastModifiedBy',
            'layoutConfig',
            'floatingWidgets',
            'backgroundWidgets',
            'isLocked'
        ],

        defaults: function() {
            return {
                position: 0,
                layoutConfig: {
                    vtype: 'tabbedpane',
                    paneType: 'tabbedpane'
                },
                floatingWidgets: new WidgetStates(),
                backgroundWidgets: new WidgetStates(),
                isLocked: false
            };
        },

        parse: function (resp, options) {
            resp = this._upgrade(resp);

            var created = resp.created,
                lastModified = resp.lastModified,
                floatingWidgets = resp.floatingWidgets,
                backgroundWidgets = resp.backgroundWidgets;

            if(lastModified) {
                resp.lastModified = new Date(lastModified);
            }

            if(created) {
                resp.created = new Date(created);
            }

            resp.floatingWidgets = new WidgetStates();
            resp.floatingWidgets.reset(floatingWidgets);

            resp.backgroundWidgets = new WidgetStates();
            resp.backgroundWidgets.reset(backgroundWidgets);

            return resp;
        },

        initialize: function () {
            Model.prototype.initialize.apply(this, arguments);

            // cache original layoutConfig config to avoid referencial chagnes
            // on save and fetch
            this.layoutConfig = this.get('layoutConfig');
        },

        getLayoutConfig: function () {
            return this.layoutConfig;
        },

        setLayoutConfig: function (layoutConfig) {
            this.layoutConfig = layoutConfig;
            return this;
        },

        save: function (key, val, options) {
            var attrs;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (key == null || typeof key === 'object') {
                attrs = key || {};
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            attrs.layoutConfig = this.getLayoutConfig();

            return Model.prototype.save.call(this, attrs, options);
        },

        getPaneWidgetsFromLayoutConfig: function (config) {
            var widgets = [];
            config = config || this.getLayoutConfig();

            if(config.box) {
                widgets = widgets.concat( this.getPaneWidgetsFromLayoutConfig(config.box.panes[0]) || []);
                widgets = widgets.concat( this.getPaneWidgetsFromLayoutConfig(config.box.panes[1]) || []);
            }
            else if(config.widgets){
                widgets = widgets.concat( config.widgets );
            }
            return widgets;
        },

        /**
        * Copies dashboard attrs onto existing dashboard
        */
        copy: function (dashboard, options) {
            var attrs = {};
            
            dashboard = dashboard.attributes ? dashboard.toJSON() : dashboard;
            options = options || {};
            
            attrs.layoutConfig = _.cloneDeep(dashboard.layoutConfig);

            attrs.floatingWidgets = new WidgetStates();
            attrs.floatingWidgets.reset(_.cloneDeep(dashboard.floatingWidgets));

            attrs.backgroundWidgets = new WidgetStates();
            attrs.backgroundWidgets.reset(_.cloneDeep(dashboard.backgroundWidgets));

            attrs.isLocked = dashboard.isLocked || dashboard.locked;

            this.set(attrs, options);
        },

        toJSON: function () {
            var json = Model.prototype.toJSON.call(this);
            json.layoutConfig = _.cloneDeep(this.getLayoutConfig());
            return json;
        },

        _upgrade: function (resp) {
            var layoutConfig = resp.layoutConfig;

            // assign default layout if server provides empty JSON object
            if(_.isEmpty(layoutConfig)) {
                resp.layoutConfig = layoutConfig = _.result(this, 'defaults').layoutConfig;
            }

            // convert to JSON if it is a string
            layoutConfig = _.isString(layoutConfig) ? JSON.parse(layoutConfig): layoutConfig;

             // is it old dashboard?
            if( layoutConfig.xtype ) {
                resp.floatingWidgets = [];
                resp.backgroundWidgets = [];
                resp.layoutConfig = this._convertLayoutConfig(resp, layoutConfig);
            }

            return resp;
        },

        // upgrades previous old layoutConfig to work with new design
        _convertLayoutConfig: function (resp, layoutConfig, parentLayout) {
            var config;

            // hbox or vbox
            if(layoutConfig.xtype === 'container') {
                config = {
                    vtype: 'boxpane',
                    paneType: 'tabbedpane',
                    box: {
                        vtype: layoutConfig.layout.type,
                        paneType: 'tabbedpane',
                        panes: [
                            this._convertLayoutConfig( resp, layoutConfig.items[0], layoutConfig.layout.type ),
                            this._convertLayoutConfig( resp, layoutConfig.items[2], layoutConfig.layout.type ) // skip second item: dashboardsplitter
                        ]
                    }
                };
            }
            //layout pane
            else {
                config = {
                    vtype: layoutConfig.xtype,
                    paneType: layoutConfig.xtype
                };

                // only set defaultSettings if truthy
                if(layoutConfig.defaultSettings) {
                    config.defaultSettings = layoutConfig.defaultSettings;
                }

                // move floating widgets to dashboard
                var floatingWidgets = _.filter(layoutConfig.widgets, function (widget) { return !!widget.floatingWidget; });
                resp.floatingWidgets = resp.floatingWidgets.concat(floatingWidgets);

                 // move background widgets to dashboard
                var backgroundWidgets = _.filter(layoutConfig.widgets, function (widget) { return !!widget.background; });
                resp.backgroundWidgets = resp.backgroundWidgets.concat(backgroundWidgets);

                config.widgets = _.filter(layoutConfig.widgets, function (widget) { return (!widget.floatingWidget && !widget.background); });
            }

            var prop = parentLayout === 'hbox' ? 'width' : 'height';
            if(layoutConfig.htmlText) {
                config[prop] = layoutConfig.htmlText || '100%';
            }
            // pane inside a container
            else if(layoutConfig.flex === 1 && parentLayout) {
                config[prop] = '50%';
            }
            else {
                config[prop] = '100%';
            }
            
            return config;
        }

    });

    return Dashboard;

});

