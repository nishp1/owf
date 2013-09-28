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
    'models/WidgetState',
    'collections/PersonalWidgetDefinitions',
    'collections/Collection',
    'lodash'
],

function(WidgetState, PersonalWidgetDefinitions, Collection, _) {
    'use strict';
    
    var WidgetStates = Collection.extend({

        model: WidgetState,

        // removes widgets that person doesn't have access to from collection
        filterInaccessibles: function (options) {
            var accessibles;

            accessibles = this.filter(function (widget) {
                var hasWidgetDefinition = widget.hasWidgetDefinition();

                //while we are iterating set view specific defaults
                if (options != null && options.modelDefaults != null && hasWidgetDefinition) {
                    _.forIn(_.result(this,'modelDefaults'), function(value, key) {
                      if (widget.get(key) == null) {
                        widget.set(key,value);
                      }
                    });
                }


                return hasWidgetDefinition;
            });

            this.reset(accessibles, options);
        }
    });

    return WidgetStates;
});
