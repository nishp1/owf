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
    'jwerty',
    'lodash'
], function($, jwerty, _) {

    var regex = /(\S+)\((.*)\)(.*)/,
        $doc = $(document);

    var KeyboardManager = {

        getKeyEventRegex: function() { 
            return regex; 
        },

        /*
        * Register a keyboard shortcut.
        * @param {DOM element} DOM element/jQuery wrapped DOM elelment
        * @param {String} event keyboard event
        * @param {String/jQuery wrapped object} CSS selector. Can be used for event delegation. If it is jQuery wrapped object, event will not be delegated to document.
        * @param {Function} Callback to execute on event
        * 
        * Usage:
        *   KeyboardManager.on(document, 'keyup(shift+alt+h)', '.button', callback);
        *   KeyboardManager.on('keyup(shift+alt+h)', '.button', callback);
        */
        on: function($el, event, selector, handler) {

            if(_.isElement($el) || $el === document) {
                $el = $($el);
            }

            // event, selector, handler
            if(!($el instanceof $)) {
                handler = selector;
                selector = event;
                event = $el;
                $el = $doc;
            }

            if(_.isFunction(selector)) {
                handler = selector;
                selector = null;
            }

            var originalEvent = event,
                parsed = regex.exec(event),
                keyEvent = parsed[1],
                jwertyCode = parsed[2],
                namespace = parsed[3],
                jwertyHandler;

            event = keyEvent + namespace;

            jwertyHandler = jwerty.event(jwertyCode, handler);

            if(selector) {
                $el.on(event, selector, jwertyHandler);
            }
            else {
                $el.on(event, jwertyHandler);
            }
            return this;
        },

        /*
        * Removes a keyboard shortcut.
        * @param {String} event keyboard event
        * @param {String/jQuery wrapped object} CSS selector or jQuer wrapped object
        * 
        * Usage:
        *   KeyboardManager.off(document, 'keyup(shift+alt+h)', '.button');
        *   KeyboardManager.off('keyup(shift+alt+h)', '.button');
        */
        off: function ($el, event, selector) {

            if(!($el instanceof $)) {
                selector = event;
                event = $el;
                $el = $doc;
            }

            var originalEvent = event,
                parsed = regex.exec(event),
                keyEvent,
                namespace;

            if(parsed) {
                keyEvent = parsed[1];
                namespace = parsed[3];
            }
            else {
                keyEvent = '';
                namespace = event;
            }

            event = keyEvent + namespace;

            if(selector) {
                $el.off(event, selector);
            }
            else {
                $el.off(event);
            }
            return this;
        },

        /*
        * Triggers a keyboard shortcut handler on a given DOM element.
        * @param {DOM element} DOM element/jQuery wrapped DOM elelment
        * @param {String} event to trigger
        * 
        * Usage:
        *   KeyboardManager.trigger(document, 'keyup(shift+alt+h)');
        */
        trigger: function ($el, event) {
            var originalEvent = event,
                parsed = regex.exec(event),
                keyEvent = parsed[1],
                jwertyCode = parsed[2];
            
            jwerty.fire(jwertyCode, $el, 0, keyEvent);
            return this;
        }
    };

    return KeyboardManager;

});
