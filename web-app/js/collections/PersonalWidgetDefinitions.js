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
    'models/PersonalWidgetDefinition',
    'collections/Collection'
],

function(PersonalWidgetDefinition, Collection) {
    'use strict';

    var PersonalWidgetDefinitions = Collection.extend({

        //This property should be set with the PersonalWidgetDefinitionCollection which contains all the pwds for the
        //currently logged in user.  This should be set in app.js
        all: null,

        url: 'prefs/widgetList',

        model: PersonalWidgetDefinition,

        comparator: function(widget) {
            return widget.get('displayName');
        }

    });

    return PersonalWidgetDefinitions;
});
