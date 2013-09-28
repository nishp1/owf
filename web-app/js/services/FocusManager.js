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
    'lodash',
    'backbone'
],

function( $, _, Backbone ) {

    'use strict';

    var $activeEl,
        $previouslyActiveEl,
        mousedownEvtTarget,
        $doc,
        focusNotSupported,
        _isInputElement = function(el) {
            var inputElements = ['INPUT', 'A', 'TEXTAREA', 'BUTTON', 'SELECT'];
            return _.contains(inputElements, el.nodeName);
        };

    /* 
     * Using browser detection here since there does not exist a clean way to 
     * detect if the browser supports focus pseudo class. We know that ie7 is the 
     * only browser we support that does not support :focus http://www.browsersupport.net/CSS/%3Afocus
     * 
     * A Google search will turn up this test http://jsfiddle.net/TCotton/e37dG/17/
     * The test is flawed as it produces a false negative in IE 8
     * 
     * An accurate test would be to verify that a style is applied when an element is given focus. 
     * This is dangerous because we would have to rob document.activeElement of its focus momentarily 
     * while we perform the test
     */
    focusNotSupported = $.browser.msie === true && $.browser.version === '7.0';

    $doc = $(document);

    $doc
        .on('mousedown', function (evt) {
            mousedownEvtTarget = evt.target;
        })
        .on('mouseup', function (evt) {
            mousedownEvtTarget = null;
        })
        .on('focusin', function (evt) {
            $activeEl = $(evt.target);

            if(mousedownEvtTarget !== evt.target) {
                $activeEl.addClass('focus');
            } 

            // Add ie7 focus class for input elements
            if(focusNotSupported && _isInputElement(evt.target)) {
                $activeEl.addClass('focus-ie7');
            } 
        })
        .on('focusout', function (evt) {
            $previouslyActiveEl = $(evt.target);

            if(mousedownEvtTarget !== evt.target) {
                $previouslyActiveEl.removeClass('focus');
            }
             
            // Remove ie7 focus class for input elements
            if(focusNotSupported && _isInputElement(evt.target)) {
                $previouslyActiveEl.removeClass('focus-ie7');
            }
        });


    return {
        activeEl: function () {
            return $activeEl || $(document.body);
        },

        previouslyActiveEl: function () {
            return $previouslyActiveEl;
        }
    };

});
