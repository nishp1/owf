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
    'models/WidgetDefinition'
], function (Model, WidgetDefinition) {
    'use strict';

    var PersonalWidgetDefinition = Model.extend({

        urlRoot: '/ozp/rest/owf/persons/me/widget-defs',

        url: function () {
            return this.urlRoot;
        },

        fields: [
            "displayName",
            "position",
            "isAssignedToPerson",
            "isFavorite",
            "isLaunchDisabled",
            "isVisibleForLaunch",
            "widgetDefinition",
            "tags"
        ],

        initialize: function () {
            var widgetDefinition = this.get('widgetDefinition');

            //only create a widgetDef model if the widgetDef field isn't already a model
            if (widgetDefinition != null && widgetDefinition.get == null) {
                widgetDefinition = new WidgetDefinition(widgetDefinition);
                this.set('widgetDefinition', widgetDefinition, { silent: true});
            }

            Model.prototype.initialize.apply(this, arguments);
        },

        //override get so that attributes which only exist on the wd can be looked up
        get: function (attr) {
            var returnValue;
            if (this.attributes[attr] !== undefined) {
                returnValue = this.attributes[attr];
            }
            else if (this.attributes.widgetDefinition != null) {
                returnValue = this.attributes.widgetDefinition.get(attr);
            }
            return returnValue;
        }
    });

    return PersonalWidgetDefinition;

});
