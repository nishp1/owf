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
    'collections/PersonalWidgetDefinitions',
    'jquery',
    'lodash'
], function (Model, PersonalWidgetDefinitions, $, _) {
    'use strict';

    var WidgetState =  Model.extend({
        fields: [
            "id",
            "widgetGuid",
            "universalName", //redundant in most cases but needed for migrating dashboards to other OWF instances
            "name",
            "active",
            "height",
            "width",
            "x",
            "y",
            "zIndex",
            "minimized",
            "maximized",
            "collapsed",
            "intentConfig",
            "launchData"
        ],

        parse: function (resp, options) {
            // rename uniqueId to id
            if (resp.uniqueId && !resp.id) {
                resp.id = resp.uniqueId;
            }

            return _.omit(resp, WidgetState.LEGACY_ATTRS);
        },

        //widget state models are not saved to the server directly
        sync: $.noop,

        _initPwd: function() {
            if (this.attributes.widgetGuid != null && PersonalWidgetDefinitions.all != null) {
                //find the related pwd and cache
                if (this.personalWidgetDefinition == null) {
                    this.personalWidgetDefinition = PersonalWidgetDefinitions.all.find(function (pwd) {
                        var wDef = pwd.get('widgetDefinition');
                        if (wDef != null) {
                            return wDef.id === this.attributes.widgetGuid;
                        }
                        else {
                            return false;
                        }
                    }, this);
                }
            }
        },

        //override get so that attributes which only exist on the pwd can be looked up from the widgetstatemodel
        get: function (attr) {
            var returnValue;
            if (this.attributes[attr] !== undefined) {
                returnValue = this.attributes[attr];
            }
            else {
                //find the related pwd and cache
                this._initPwd();

                //if there was a pwd then return the requested field
                if (this.personalWidgetDefinition != null) {
                    returnValue = this.personalWidgetDefinition.get(attr);
                    //if attribute was not on the pwd then check the widgetDef
                    if (returnValue == null) {
                        var widgetDef = this.personalWidgetDefinition.get('widgetDefinition');
                        if (widgetDef != null) {
                            returnValue = widgetDef.get(attr);
                        }
                    }
                }
            }
            return returnValue;
        },

        hasWidgetDefinition: function(){
            this._initPwd();
            return this.personalWidgetDefinition != null && this.personalWidgetDefinition.get('widgetDefinition') != null;
        }
    },
    {
        LEGACY_ATTRS: ['uniqueId', 'columnPos', 'buttonId', 'buttonOpened', 'region', 'statePosition', 'floatingWidget', 'background'],
        createFromPersonalWidgetDefinition: function (pwd) {
            var wd = pwd.get('widgetDefinition') || {};

            //create a new WidgetState model with wd, and pwd properties flattened into it
            var widgetState = new WidgetState($.extend({}, wd.attributes, _.omit(pwd.attributes,'widgetDefinition')));

            //set widgetGuid ref to wd
            widgetState.set('widgetGuid', wd.id);

            //set name because pwd field is called displayname
            widgetState.set('name', pwd.get('displayName'));

            //set personalWidgetDefinition ref
            widgetState.personalWidgetDefinition = pwd;

            return widgetState;
        }
    });

    return WidgetState;
});
