package ozone.owf.grails.controllers

/**
 * User controller.
 */
class IndexController {

    def index = {
        def htmlContent = new File('web-app/index.html').text
        render text: htmlContent, contentType:"text/html", encoding:"UTF-8"
    }
}
