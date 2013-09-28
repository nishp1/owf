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
;(function (window, document, OWF, Comms, jwerty, $, undefined) {
    'use strict';

    var KeyNavKeys = Comms.Constants.KeyNav.Keys,
        keynavRegex = /(\S+)\((.*)\)(.*)/,
        keyups = [],
        keydowns = [];

    // parse keynav combo and store in keyup or keydown array
    for(var key in KeyNavKeys) {
        if(KeyNavKeys.hasOwnProperty( key )) {
            var matches = keynavRegex.exec( KeyNavKeys[key] ),
                type = matches[1],
                keynavCombo = matches[2];

            if(type === 'keyup') {
                keyups.push(keynavCombo);
            }
            else if(type === 'keydown') {
                keydowns.push(keynavCombo);
            }
        }
    }


    function checkMatch (type, evt) {
        var arr;
        if(type === 'keyup') {
            arr = keyups;
        }
        else if(type === 'keydown') {
            arr= keydowns;
        }

        for(var i = 0, len = arr.length; i < len; i++) {
            key = arr[i];

            if( jwerty.is(key, evt) ) {
                Comms.send('..', '_key_eventing', null, OWF.getInstanceId(), {
                    type: type,
                    keynavCombo: key
                });
                break;
            }
            
        }
    }

    $(document)
        .on('keyup', function (evt) {
            checkMatch('keyup', evt);
        })
        .on('keydown', function (evt) {
            checkMatch('keydown', evt);
        });

})(window, document, window.OWF, window.OWF.Comms, window.jwerty, window._$);