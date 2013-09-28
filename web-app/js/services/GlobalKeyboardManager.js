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
    'services/KeyboardManager',
    'jquery',
    'jwerty',
    'lodash'
], function(KeyboardManager, $, jwerty, _) {

    var $doc = $(document),
        regex = KeyboardManager.getKeyEventRegex();

    var GlobalKeyboardManager = {


       /*
        * Register a keyboard shortcut.
        * @param {String} event keyboard event
        * @param {String/jQuery wrapped object} CSS selector. Can be used for event delegation. If it is jQuery wrapped object, event will not be delegated to document.
        * @param {Function} Callback to execute on event
        * 
        * Usage:
        *   GlobalKeyboardManager.on('keyup(shift+alt+h)', '.button', callback);
        */
        on : function(event, selector, handler) {

            if(_.isFunction(selector)) {
                handler = selector;
                selector = null;
            }

            var originalEvent = event,
                parsed = regex.exec(event),
                keyEvent = parsed[1],
                jwertyCode = parsed[2],
                namespace = parsed[3],
                preventDefaultOnKeyDown = function (evt) {
                    if(jwerty.is(jwertyCode, evt)) {
                        evt.preventDefault();
                    }
                };

            KeyboardManager.on($doc, event, selector, handler); // delegate to KeyboardManager

            // Add prevent default handlers for keydown events in order to prevent browser default behavior 
            // from interrupting global keyboard combinations
            if(selector) {
                keyEvent === 'keyup' && $doc.on('keydown' + namespace, selector, preventDefaultOnKeyDown);
            }
            else {
                keyEvent === 'keyup' && $doc.on('keydown' + namespace, preventDefaultOnKeyDown);
            }
            return this;
        },

       /*
        * Removes a keyboard shortcut.
        * @param {String} event keyboard event
        * @param {String/jQuery wrapped object} CSS selector or jQuer wrapped object
        * 
        * Usage:
        *   GlobalKeyboardManager.off('keyup(shift+alt+h)', '.button');
        */
        off: function (event, selector) {
            KeyboardManager.off($doc, event, selector);
            return this;
        },

       /*
        * Triggers a keyboard shortcut handler on a given DOM element.
        * @param {String} event to trigger
        * 
        * Usage:
        *   GlobalKeyboardManager.trigger('keyup(shift+alt+h)');
        */
        trigger: function (event) {
            KeyboardManager.trigger($doc, event);
            return this;
        }

    };

    return GlobalKeyboardManager;

});