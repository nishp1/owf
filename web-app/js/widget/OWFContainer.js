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
 * Container-side code to support API calls that
 * are directly on the OWF object widget-side
 */
define([
    'models/Person',
    'comms/Container',
    'comms/Comms',
    'comms/Constants',
    'lodash'
], function(Person, CommsContainer, Comms, Constants, _) {
    'use strict'; 

    return {
        init: function() {
            Comms.registerBackboneSyncHandler(Constants.GET_CURRENT_USER_SERVICE_NAME, 
                _.bind(Person.getCurrentPerson, Person));

            Comms.register(Constants.LIST_WIDGETS_SERVICE_NAME, 
                _.bind(CommsContainer.getOpenedWidgets, CommsContainer));
        },

        destroy: function() {
            Comms.unregister(Constants.GET_CURRENT_USER_SERVICE_NAME);
            Comms.unregister(Constants.LIST_WIDGETS_SERVICE_NAME);
        }
    };
});
