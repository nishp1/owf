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
    'backbone',
    'jquery'
],

function(Backbone, $) {
    return {
        /**
         * By default, sync returns the jqXhr, and has
         * success and error callbacks passed in as 
         * options, which are passed the model when called.
         *
         * This method changes the return value to a normal
         * promise, whose functions take the same parameters
         * as the options.success and options.error callbacks.
         */
        sync: function(method, model, options) {
            var deferred = new $.Deferred(),
                success, error;


            options = options || {};
            success = options.success;
            error = options.error;

            options.success = function() {
                if (success) {
                    success.apply(this, arguments);
                }
                deferred.resolve.apply(deferred, arguments);
            };

            options.error = function() {
                if (error) {
                    error.apply(this, arguments);
                }
                deferred.reject.apply(deferred, arguments);
            };
            
            Backbone.sync(method, model, options);

            return deferred.promise();
        }
    };
});
