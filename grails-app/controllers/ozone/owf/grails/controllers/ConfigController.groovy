package ozone.owf.grails.controllers

import grails.converters.JSON
import org.apache.commons.lang.time.StopWatch
import ozone.owf.grails.OwfException

/**
 * User controller.
 */
class ConfigController {

    def accountService
    def grailsApplication
    def preferenceService
    def themeService
    def serviceModelService
    def dashboardService
    def personWidgetDefinitionService

    def config = {
        def curUser = accountService.getLoggedInUser()

        def widgetNamesResults = preferenceService.show([namespace: 'owf.custom.widgetprefs',
                path: 'widgetNames'])
        def widgetNames = widgetNamesResults.preference?.value ? widgetNamesResults.preference.value : [:] as JSON

        def bannerStateResults = preferenceService.show([namespace: 'owf.banner',
                path: 'state'])
        def bannerState = bannerStateResults.preference?.value ? bannerStateResults.preference.value : [:] as JSON

        def pDate = new Date()
        def pDateString = null
        if (curUser.prevLogin != null) {
          pDate = curUser.prevLogin
        }
        pDateString = prettytime.display(date: pDate).toString()
        if ("1 day ago".equalsIgnoreCase(pDateString)) { pDateString = 'Yesterday' }

        def groups = []
        curUser.groups.each { 
            if (!it.stackDefault) { groups.add(serviceModelService.createServiceModel(it)) }
        }
        def emailString = curUser.email != null ? curUser.email : ''

        def isAdmin = accountService.getLoggedInUserIsAdmin()

        def curUserResult = [displayName: curUser.username, userRealName:curUser.userRealName,
                prevLogin: pDate, prettyPrevLogin: pDateString, id:curUser.id, groups:groups, email: emailString,
                isAdmin: isAdmin] as JSON

        def themeResults = themeService.getCurrentTheme()
        def theme = [:]

        //use only key information
        theme["themeName"] =  themeResults["name"]
        theme["themeContrast"] =  themeResults["contrast"]
        theme["themeFontSize"] =  themeResults["owf_font_size"]
        
        //copy owf section of grails config, removing sensitive properties
        def conf = grailsApplication.config.owf.clone()
        conf.metric = conf.metric.findAll { 
            ! (it.key in ['keystorePass', 'truststorePass', 'keystorePath', 'truststorePath'])
        }

        def dashboardsResult,
            widgetsResult,
            dashboards = [],
            widgets = [];
        StopWatch stopWatch = null;

        if (log.isInfoEnabled()) {
          stopWatch = new StopWatch();
          stopWatch.start();
          log.info("Executing dashboardService: list");
        }

        try {
            dashboardsResult =  dashboardService.list(params)
            dashboards =  dashboardsResult.dashboardList;
        }
        catch (OwfException owe) {
            handleError(owe)
        }

        if (log.isInfoEnabled()) {
            log.info("Executed dashboardService: list in " + stopWatch);
            stopWatch.reset();
            log.info("Executing personWidgetDefinitionService: widgetList");
        }

        try {
            widgetsResult = personWidgetDefinitionService.list(params);
            widgets = widgetsResult.personWidgetDefinitionList;
        }
        catch(OwfException owe) {
            handleError(owe)
        }
        
        if (log.isInfoEnabled()) {
            log.info("Executed personWidgetDefinitionService: widgetList in " + stopWatch);
        }

        render(
            view: 'config_js',
            model: [
                user: curUserResult,
                widgetNames: widgetNames,
                bannerState: bannerState,
                currentTheme: theme as JSON,
                conf: conf as JSON,
                dashboards: dashboards,
                widgets: widgets
            ],
            contentType: 'text/javascript'
        )
    }

}
