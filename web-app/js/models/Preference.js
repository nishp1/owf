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

    var Preference = Model.extend({
        fields: [
            "name",
            "namespace",
            "value"
        ],

        defaults: {
            "name": null,
            "namespace": null,
            "value": null
        },

        //the scope and scopeId on which to
        //save or look for this preference.  I am
        //making these traditional properties and not model
        //attrs because the server does not return their value
        //in its response.
        scope: null,
        scopeId: null,

        /**
         * create a URL for preferences with the specified owner scope, owner guid,
         * namespace, and name.
         *
         * Preference URLs work as follows.  
         *
         * groups/<group-guid>/preferences/<namespace>/<name>
         *  A specific preference attached to a specific group
         *
         * persons/<person-guid>/preferences/<namespace>/<name>
         *  A specific preference attached to a specific user
         *
         * persons/me/preferences/<namespace>/<name>
         *  A specific preference attached to the current user.
         *  This URL is used when scope = person and scopeId is not
         *  set.
         *
         * preferences/<namespace>/<name>
         *  A hierarchical lookup of the specified preference.  The preference is first
         *  searched for on the current user, then in groups that user is a member of (excluding
         *  "OWF Users") and finally in the "OWF Users" group.
         *
         *  Preferences may be created by POSTing to persons/<person-guid>/preferences
         *  or groups/<group-guid>/preferences
         */
        url: function() {
            var urlSegments = [],
                scope = this.scope,
                guid = this.scopeId,
                namespace = this.get('namespace'),
                name = this.get('name');

            if (scope) {
                //pluralize the scope
                urlSegments.push(scope + 's');

                if (guid) {
                    urlSegments.push(guid);
                }
                else {
                    throw "Preference: This scope can only be used with an explicit GUID";
                }
            }

            urlSegments.push('preferences');

            return '/ozp/rest/owf/' + _.map(urlSegments, function(seg) {
                return encodeURIComponent(seg);
            }).join('/');
        },

        /**
         * Custom sync method that handles the way that
         * preferences URLs are created
         */
        sync: function(method, model, options) {
            var namespace = model.get('namespace'),
                name = model.get('name');

            options = options || {};

            if (!(namespace && name)) {
                throw "Preference does not have necessary attributes to communicate with server";
            }

            //do not distinguish between create and update
            if (method === 'update') {
                method = 'create';
            }

            //save preferences to person by default
            if (!model.scope && (method === 'create' || method === 'delete')) {
                model.scope = 'person';
            }

            if (model.scope === 'person' && !model.scopeId) {
                model.scopeId = 'me';
            }

            //namespace and name are part of the URL for referencing existing
            //prefs.  But for create/update, the URL ends at 'preferences' and
            //the namespace and name are passed in the JSON
            if (method !== 'create') {
                options.url = model.url() + '/' + namespace + '/' + name;
            }

            return Model.prototype.sync.call(this, method, model, options);
        },

        //since preferences do not have ids,
        //treat them as never new
        isNew: function() { return false; }
    });

    return Preference;
});
