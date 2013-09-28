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
    'util/Sync',
    'backbone',
    'jquery',
    'lodash'
],

function(Sync, Backbone, $, _) {
    'use strict';
    
    var Model = Backbone.Model.extend({

        /*
         * {
         *      create  : '/create',
         *      read    : '/read',
         *      update  : '/update',
         *      delete  : '/delete'
         * }
         */
        api: null,

        sync: function(method, model, options) {
            // pick url from api if found
            var api = _.result(model, 'api');

            if(!options.url && api && api[method]) {
                options.url = api[method];
            }
            
            return Sync.sync.call(this, method, model, options);
        },

        // handle model attributes that are an instance of backbone's Model or Collection
        toJSON: function (options) {
            var attrs = {};

            _.forEach(this.attributes, function (val, key) {
                if(val instanceof Backbone.Collection || val instanceof Backbone.Model) {
                    attrs[key] = val.toJSON();
                }
                else {
                    attrs[key] = _.cloneDeep(val);
                }
            });

            return attrs;
        }

    });
  
    return Model;

});
