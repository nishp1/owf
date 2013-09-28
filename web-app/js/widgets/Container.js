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
 * This file defines functions for the Widget API related to retrieving information
 * about widgets
 */

define([
    'collections/WidgetDefinitions',
    'comms/Comms',
    'comms/Constants',
    'lodash'
], function(WidgetDefinitions, Comms, Constants, _) {
    'use strict';

    //from http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function like(str, pattern) {
        //escape regex characters in pattern then turn '%' into '.*', and then make
        //a regex out of it
        var regex = new RegExp(escapeRegExp(pattern).replace(/%/g, '.*'));

        return regex.test(str);
    }

    return {
        /**
         * @param cfg.widgetDefinitions A collection of all widget definitions
         * to which the current user has access
         * @param cfg.personalWidgetDefintions A PersonalWidgetDefinitions
         * containing all PersonalWidgetDefinitions assigned to the current user
         */
        init: function(cfg) {
            this.personalWidgetDefinitions = cfg.personalWidgetDefinitions;
            this.widgetDefinitions = new WidgetDefinitions(
                this.personalWidgetDefinitions.map(function(pwd) {
                    return pwd.get('widgetDefinition');
                })
            );

            Comms.registerWithPromise(
                Constants.FIND_WIDGET_DEFINITIONS_SERVICE_NAME, _.bind(this.findWidgetDefinitions, this));
        },

        findWidgetDefinitions: function(cfg) {
            var me = this,
                matches;

            cfg = cfg || {};

            matches = me.widgetDefinitions.filter(function(widgetDef) {
                if (cfg.displayName) {
                    if (cfg.displayNameExactMatch && widgetDef.get('displayName') !== cfg.displayName) {
                        return false;
                    }
                    else if (!like(widgetDef.get('displayName'), cfg.displayName)) {
                        return false;
                    }
                }

                if (cfg.version && !like(widgetDef.get('version'), cfg.version)) {
                    return false;
                }

                if (cfg.id && !like(widgetDef.id, cfg.id)) {
                    return false;
                }

                if (cfg.universalName && !like(widgetDef.get('universalName'), cfg.universalName)) {
                    return false;
                }

                if (cfg.userOnly) {
                    var foundPdef = me.personalWidgetDefinitions.find(function(pdef) { 
                        return pdef.get('widgetDefinition') === widgetDef && pdef.get('isAssignedToPerson', true);
                    });

                    if (!foundPdef) {
                        return false;
                    }
                }

                return true;
            });
            
            return _.map(matches, function(model) {
                return model.toJSON();
            });
        },

        destroy: function() {
            Comms.unregister(Constants.FIND_WIDGET_DEFINITIONS_SERVICE_NAME);

            this.personalWidgetDefinitions = this.widgetDefinitions = undefined;
        }
    };
});
