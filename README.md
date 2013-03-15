# TotalCarousel

A jQuery plugin to create a full width sliding carousel. It supports static content such as images as well videos loaded from YouTube (you'll have to provide your Google API key for this service).

## Quick Start

An example of a simple image carousel.

### Requirements

Scripts:

* jQuery-1.9.js - [Google API link](http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js)
* totalCarousel.js - [GitHub Link](https://github.com/abarron87/total-carousel/blob/master/app/public/js/totalCarousel.js)

Stylesheets:
* Yahoo Reset CSS - [Yahoo CSS Link](http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css)
* Animate.css - [Website Link](http://daneden.me/animate/)
* Main CSS - [GitHub Link](https://github.com/abarron87/total-carousel/blob/master/app/public/css/style.css)

### Setup

```html
<!-- HTML page start -->

<section id="myCarousel" class="gallery">
    <div class="loading">
        <div id="block_1" class="barlittle"></div>
        <div id="block_2" class="barlittle"></div>
        <div id="block_3" class="barlittle"></div>
        <div id="block_4" class="barlittle"></div>
        <div id="block_5" class="barlittle"></div>
    </div>
    <div class="slideConfig">
        {
            "images": [
                {
                    "src": "path/to/image.extension"
                },
                {
                    "src": "path/to/image.extension"
                },
                {
                    "src": "path/to/image.extension"
                },
                {
                    "src": "path/to/image.extension"
                },
                {
                    "src": "path/to/image.extension"
                }
            ]
        }
    </div>
</section>
<div id="fullScreen" class="overlay hide">
    <div class="image"></div>
</div>
<script>
    //Need images to have loaded.
    jQuery(document).ready(function(){
        jQuery("#myCarousel").totalCarousel({
            dynamic: false
        });
    });
</script>

<!-- End of HTML -->
```