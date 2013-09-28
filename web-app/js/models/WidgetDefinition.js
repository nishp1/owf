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
    'lodash'
],

function(Model, _) {
    'use strict';

    var WidgetDefinition = Model.extend({

        urlRoot: '/ozp/rest/owf/widget-defs',

        fields: [
            "displayName",
            "widgetUrl",
            "imageUrlLarge",
            "imageUrlSmall",
            "widgetType",
            "universalName",
            "description",
            "descriptorUrl",
            "version",
            "height",
            "width",
            "isBackground",
            "isSingleton",
            "isVisibleForLaunch",
            "sendableIntents",
            "receivableIntents",
            "requiredWidgets",
            "tags"
        ],

        /**
         * @param exclusions Ids of Widgets that should be excluded from
         * the return and which should not have their dependencies searched.  This
         * is used in recursive calls to this function in order to handle circular
         * dependencies.
         *
         *
         * @return a list of ids of all widgets
         * that this widget requires, calculated recursively
         */
        getAllRequiredWidgets: function(exclusions) {
            var required = _.difference(this.get('requiredWidgets'), exclusions) || [],
                subDeps,
                me = this;

            if (!me.collection) {
                throw "Cannot getAllRequiredWidgets when not part of a collection";
            }

            //get array of arrays of subdependencies
            subDeps = _.map(required, function(reqId) {
                var reqWidgetDef = me.collection.get(reqId);
                return reqWidgetDef.getAllRequiredWidgets(required);
            });

            //flatten subdependencies, add on direct dependencies,
            //and filter out duplicates
            return _.uniq(required.concat(_.flatten(subDeps)));
        },

        toJSON: function() {
            var allRequired;

            try {
                allRequired = this.getAllRequiredWidgets();
            }
            catch (e) {
                allRequired = null;
            }

            return _.extend({
                allRequiredWidgets: allRequired
            }, Model.prototype.toJSON.call(this));
        }

    });

    return WidgetDefinition;

});
