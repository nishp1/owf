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
    'jquery',
    'bootstrap-notify'
], function ($) {

    'use strict';

    var initialized;

    return {

        /**
         * Sets up the required body elements to support the notifications.
         */
        initialize: function () {
            if (!initialized) {
                $('body').append("<div class='notifications top-left'></div>")
                    .append("<div class='notifications top-right'></div>")
                    .append("<div class='notifications bottom-left'></div>")
                    .append("<div class='notifications bottom-right'></div>")
                    .append("<div class='notifications center'></div>");
                initialized = true;
            }
            return true;
        },

        /**
         * Display a notification message to the user that will disappear after a 
         * a short delay.  
         * @param {String} msg The msg of the notification
         * @param {String} type Bootstrap alert type string
         * @param {Function} onclose  on close handler to be called prior to the
         * notification being removed from the page
         * @param {Function} onclosed on closed handler to be called after the
         * notification has been removed
         */

        notify: function  (msg, type, onclose, onclosed) {

            if (!initialized) {
                this.initialize();
            }

            $('> .notifications.bottom-right', document.body).notify({
                type: type || 'success',
                closable: true,
                fadeOut: {
                    enabled: true,
                    delay: 3000
                },
                message: {
                    html: msg
                },
                onclose: onclose,
                onclosed: onclosed
            }).show();
        }

    };

});