Portfolio Item Throughput
========================

![Alt text](https://raw.github.com/osulehria/rally-feature-throughput/master/deploy/screenshot.png)

##Overview

This is an Rally SDK app that graphs the feature throughput of multiple types of items (think Strategy, Theme, Initiative, Enhancement, etc.) over a certain number of months you specify on the top right text field.

Hovering over a colored bar will show the name of the type, its XY position, and percentage completed. Clicking on a colored bar will show a list of types on the bottom of the frame. You can also specify bars to be stacked which combines the values into month increments (you can still individually click on each color and get a different list).

##How to Use

If you want to start using the app immediately, create an Custom HTML app on your Rally dashboard. Then copy FeatureThroughputApp.html in the deploy folder into the HTML text area. That's it, it should be ready to use.

Or you can just click [here](https://raw.github.com/osulehria/rally-feature-throughput/master/deploy/FeatureThroughputApp.html) to find the file.

##Customize this App

This app includes a Rakefile with these tasks that will help you deploy the app in such a way that Rally will recognize your code:

Available tasks are:

    rake combine       # Parses mashup HTML and replaces stylesheet includes with the referenced CSS content and JS includes with the JS itself to create Rally-ready HTML
    rake default       # Default task
    rake deploy        # Combine and run jslint
    rake deployall     # Build all apps and copy the built output to lam
    rake jslint        # Runs JSLint on all component JavaScript files
    rake new[appName]  # Create a new app

If you want to include more Javascript files, simply add them to the FeatureThroughput.template.html within the header. It's the same with CSS files, just add the stylesheet name to the header in the HTML template file.

##License

PortfolioItem Throughput  is released under the MIT license. See the file [LICENSE](https://raw.github.com/osulehria/rally-feature-throughput/master/LICENSE) for the full text.