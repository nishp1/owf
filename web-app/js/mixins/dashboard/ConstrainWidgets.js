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
 * Common logic to constrain widget headers to be inside an element. 
 * Used by DashboardInstance for floating widgets and DesktopPane.
 */
define([
    'jquery'
], function($) {
    'use strict';

    return {
        adjustHiddenHeaders: function($containment) {
            $containment = $containment instanceof $ ? $containment : this.$el;

            var me = this,
                bodyHeight = $containment.height(),
                bodyWidth = $containment.width(),
                $widget,
                widgetPositionTop,
                widgetPositionLeft,
                headerPositionBottom,
                headerPositionRight,
                pixelsBelowBody,
                pixelsRightOfBody,
                newTop,
                newLeft;

            if(bodyHeight > 0 && bodyWidth > 0) {
                // Check if any of the widgets' headers are outside the body from the resize
                $containment.children('.widget').each(function (i, widget) {
                    $widget = $(this);
                    widgetPositionTop = $widget.position().top;
                    widgetPositionLeft = $widget.position().left;
                    headerPositionBottom = widgetPositionTop + $widget.children('.header').outerHeight(true);
                    headerPositionRight = widgetPositionLeft + $widget.outerWidth(true);
                    pixelsBelowBody = headerPositionBottom - bodyHeight;
                    pixelsRightOfBody = headerPositionRight - bodyWidth;

                    // If below body, adjust widget top to move it up and keep it inside
                    if(pixelsBelowBody > 0) {
                        newTop = widgetPositionTop - pixelsBelowBody;
                        newTop = newTop > 0 ? newTop : 0; //Don't go outside the top of the body
                        $widget.css('top', newTop);
                    }
                    // If right of body, adjust widget left to move it left and keep it inside
                    if(pixelsRightOfBody > 0) {
                        newLeft = widgetPositionLeft - pixelsRightOfBody;
                        newLeft = newLeft > 0 ? newLeft : 0; //Don't go outside the left of the body
                        $widget.css('left', newLeft);
                    }
                });
            }
        }
    };
});
