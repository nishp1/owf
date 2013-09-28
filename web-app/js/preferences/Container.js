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
    'models/Preference',
    'comms/Comms',
    'comms/Constants',
    'util/Util',
    'lodash'
], function(Preference, Comms, Constants, Util, _) {
    'use strict';

    /**
     * Common code used to implement getPreference, setPreference, and deletePreference.
     *
     * @param cfg The cfg passed in from the widget, used as a source of values for 
     *   attrs and props
     * @param verb The method to call on the Preference. Example: 'save'
     * @param attrsToPass List of names of properties to pass into model constructor as
     *   model attributes
     * @param propsToPass List of names of properties that will be added on to the model 
     *   as normal javascript properties
     */
    function preferenceFunction(cfg, verb, attrsToPass, propsToPass) {
        var attrs = Util.filterAttrs(cfg, attrsToPass),
            props = Util.filterAttrs(cfg, propsToPass),
            model;

        //create the model by passing in the attrs in the constructor
        //and then adding props directly on to it
        model = _.extend(new Preference(attrs), props);

        //perform the requested action, and 
        //return the resulting promise.  This assumes that the action
        //specified by 'verb' is asynchronous and returns a Backbone.sync Promise
        return model[verb]();
    }

    /* The following functions are registered with gadgets.rpc. */ 

    function getPreference(cfg) {
        return preferenceFunction(cfg, 'fetch', ['namespace', 'name'], ['scope', 'scopeId']);
    }
    
    function setPreference(cfg) {
       return preferenceFunction(cfg, 'save', 
                ['namespace', 'name', 'value'], ['scope', 'scopeId']);
    }

    function deletePreference(cfg) {
        return preferenceFunction(cfg, 'destroy', 
                ['namespace', 'name'], ['scope', 'scopeId']);
    }


    return {
        init: function() {
            Comms.registerBackboneSyncHandler(Constants.GET_PREFERENCE_SERVICE_NAME, 
                    getPreference);
            Comms.registerBackboneSyncHandler(Constants.SET_PREFERENCE_SERVICE_NAME, 
                    setPreference);
            Comms.registerBackboneSyncHandler(Constants.DELETE_PREFERENCE_SERVICE_NAME, 
                    deletePreference);
        },

        destroy: function() {
            Comms.unregister(Constants.GET_PREFERENCE_SERVICE_NAME);
            Comms.unregister(Constants.SET_PREFERENCE_SERVICE_NAME);
            Comms.unregister(Constants.DELETE_PREFERENCE_SERVICE_NAME);
        }
    };
});
