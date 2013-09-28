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
    'comms/Container',
    'eventing/Container',
    'preferences/Container',
    'dashboards/Container',
    'widgets/Container',
    'rpc/Container',
    'widget/OWFContainer',
    'keynav/KeyNavContainer',
    'dragndrop/Container',
    'jquery'
], function (CommsContainer, EventingContainer, PreferencesContainer, 
        DashboardsContainer, WidgetsContainer, RPCContainer, 
        OWFContainer, KeyNavContainer, DragnDropContainer, $) {
    'use strict';

    return {
        init: function(cfg) {
            CommsContainer.init({
                //todo pull the context from config
                containerRelay: '/owf/js/eventing/rpc_relay.uncompressed.html',
                getOpenedWidgets: {
                    fn: cfg.dashboardContainer.getOpenedWidgets,
                    scope: cfg.dashboardContainer
                }
            });
            EventingContainer.init({
                onRoute: {
                    fn: function(sender, subscriber, channel, message) {
                        var returnValue = false;

                        //if the sender or subscriber is the container then always let the message through
                        if (sender != '..' && subscriber != '..') {
                            //check if the sender and subscriber are on the same dashboard if so allow the message else deny it
                            var senderDashboard = $(document.getElementById(sender)).data('dashboardGuid');
                            var subscriberDashboard = $(document.getElementById(subscriber)).data('dashboardGuid');
                            if (senderDashboard != null && senderDashboard == subscriberDashboard) {
                                returnValue = true;
                            }
                        }
                        else {
                            returnValue = true;
                        }

                        return returnValue;
                    },
                    scope: this
                }
            });
            PreferencesContainer.init();
            DashboardsContainer.init({dashboardInstances: cfg.dashboardInstances});
            WidgetsContainer.init({personalWidgetDefinitions: cfg.personalWidgetDefinitions});
            OWFContainer.init();
            KeyNavContainer.init();
            RPCContainer.init({
                getIframeId: CommsContainer.getIframeId
            });
            DragnDropContainer.init();
        }
    };

});
