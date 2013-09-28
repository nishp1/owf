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
 * This file holds constants used for channel names and service names within
 * the OWF communication mechanisms
 */

/*global gadgets, define*/
;(function(window) {
    'use strict';

    var Constants = {
        //Shared Constants
        CONTAINER_INIT_SERVICE_NAME: 'container_init',
        AFTER_CONTAINER_INIT_SERVICE_NAME: 'after_container_init',
        FUNCTION_CALL_SERVICE_NAME: 'FUNCTION_CALL',
        DIRECT_MESSAGE_SERVICE_NAME: 'DIRECT_MESSAGE',
        WIDGET_READY_SERVICE_NAME: '_widgetReady',
        LIST_WIDGETS_SERVICE_NAME: 'LIST_WIDGETS',

        //Widget Constants
        FIND_WIDGET_DEFINITIONS_SERVICE_NAME: '_find_widget_definitions',
        GET_CURRENT_USER_SERVICE_NAME: '_current_user_get',
        WIDGET_ACTIVATED_SERVICE_NAME: '_widget_activated',
        WIDGET_DEACTIVATED_SERVICE_NAME: '_widget_deactivated',
        WIDGET_STATE_CHANNEL_PREFIX: '_WIDGET_STATE_CHANNEL_',

        //Dashboards Constants
        GET_ALL_DASHBOARDS_SERVICE_NAME: '_getAllDashboard',

        //Preference Constants
        GET_PREFERENCE_SERVICE_NAME: '_preference_get',
        SET_PREFERENCE_SERVICE_NAME: '_preference_set',
        DELETE_PREFERENCE_SERVICE_NAME: '_preference_delete',

        //RPC Constants
        GET_WIDGET_READY_SERVICE_NAME: '_getWidgetReady',
        GET_FUNCTIONS_SERVICE_NAME: 'GET_FUNCTIONS',
        REGISTER_FUNCTIONS_SERVICE_NAME: 'register_functions',
        FUNCTION_CALL_RESULT_SERVICE_NAME: 'FUNCTION_CALL_RESULT',
        FUNCTION_CALL_RESULT_CLIENT_SERVICE_NAME: 'FUNCTION_CALL_RESULT_CLIENT',
        FUNCTION_CALL_CLIENT_SERVICE_NAME: 'FUNCTION_CALL_CLIENT',
        DIRECT_MESSAGE_CLIENT_SERVICE_NAME: 'DIRECT_MESSAGEL_CLIENT',
        EVENT_CLIENT_SERVICE_NAME: 'EVENT_CLIENT',
        ADD_EVENT_CLIENT_SERVICE_NAME: 'ADD_EVENT',
        CALL_EVENT_CLIENT_SERVICE_NAME: 'CALL_EVENT',
        CLOSE_EVENT_CLIENT_SERVICE_NAME: 'CLOSE_EVENT',

        FAKE_MOUSE_UP_SERVICE_NAME: '_fake_mouse_up',
        FAKE_MOUSE_MOVE_SERVICE_NAME: '_fake_mouse_move',
        FAKE_MOUSE_OUT_SERVICE_NAME: '_fake_mouse_out',

        FIRE_MOUSE_UP_SERVICE_NAME: '_fire_mouse_up',
        FIRE_MOUSE_MOVE_SERVICE_NAME: '_fire_mouse_move',

        DRAG_START_CHANNEL: '_dragStart',
        DRAG_OVER_WIDGET_CHANNEL: '_dragOverWidget',
        DRAG_OUT_CHANNEL: '_dragOutName',
        DRAG_STOP_IN_CONTAINER_CHANNEL: '_dragStopInContainer',
        DRAG_STOP_IN_WIDGET_CHANNEL: '_dragStopInWidget',
        DRAG_SEND_DATA_CHANNEL: '_dragSendData',
        DROP_RECEIVE_DATA_CHANNEL: '_dropReceiveData',


        //marketplace widget
        ADD_WIDGET_CHANNEL_NAME: "_ADD_WIDGET_CHANNEL",
        
        // OWF Keyboard Navigation Shortcuts
        KeyNav: {
            SERVICE_NAME: '_key_eventing',
            Keys: {
                DASHBOARD_SWITCHER: 'keyup(shift+alt+c)',
                METRIC: 'keyup(shift+alt+r)',
                ADMINISTRATION: 'keyup(shift+alt+a)',
                HELP: 'keyup(shift+alt+h)',
                LAUNCH_MENU: 'keyup(shift+alt+l)',
                MARKETPLACE: 'keyup(shift+alt+m)',
                LOGOUT: 'keyup(shift+alt+o)',
                WIDET_SWITCHER: 'keyup(shift+alt+q)',
                SETTINGS: 'keyup(shift+alt+s)',
                CLOSE_WIDGET: 'keyup(shift+alt+w)',
                NEXT_DASHBOARD: 'keyup(shift+alt+pgup)',
                PREVIOUS_DASHBOARD: 'keyup(shift+alt+pgdown)',
                MAXIMIZE_COLLAPSE_WIDGET: 'keyup(shift+alt+up)',
                MINIMIZE_EXPAND_WIDGET: 'keyup(shift+alt+down)',
                ESCAPE_FOCUS: 'keyup(esc)',
                MOVE_UP: 'keydown(ctrl+up)',
                MOVE_RIGHT: 'keydown(ctrl+right)',
                MOVE_LEFT: 'keydown(ctrl+left)',
                MOVE_DOWN: 'keydown(ctrl+down)'
            }
        }
    };
    
    //requirejs support
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define([], function () {
            return Constants;
        });
    }
    else {
        var OWF = window.OWF = window.OWF || {};
        OWF.Comms = window.OWF.Comms = window.OWF.Comms || {};
        OWF.Comms.Constants = Constants;
    }
})(window);
