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

;(function (window, document, undefined) {
    'use strict';

    var Version = {

        owfversion: '8.0.0-ALPHA-SPRINT9-SNAPSHOT',

        mpversion: '2.3',

        preference: '-v1',

        eventing: '-v1',

        widgetLauncher: '-v1',

        state: '-v1',

        dragAndDrop: '-v1',

        widgetChrome: '-v1',

        logging: '-v1',

        language: '-v1'

    };

    //requirejs support
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function () {
            return Version;
        });
    }
    else {
        var OWF = window.OWF = window.OWF || {};
        //put on Ozone namespace for backwards compat
        var Ozone = window.Ozone = window.Ozone || {};
        OWF.Version = Ozone.version = Version;
    }
})(window, document);

