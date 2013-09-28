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
 * An Iframe subclass with the WidgetControl mixin.  Used in the 
 * FitPane and TabbedPane
 */
define([
    'views/widgets/Iframe',
    'mixins/widgets/WidgetControl',
    'lodash'
], function(Iframe, WidgetControl, _) {
    'use strict';

    return Iframe.extend(_.extend({}, WidgetControl, {
        initialize: function() {
            Iframe.prototype.initialize.apply(this, arguments);
            WidgetControl.initialize.apply(this, arguments);
        }
    }));

});
