var TotalGallery = function(options){
	var defaults = {
		fullScreenSelector: "#fullScreen",
		fullScreenId: "fullScreen",
		ulClass: "images",
		buildNavigation: true,
		enableKeypress: true,
		autoPlay: false,
		selector: "#galleryConfig",
		context: ""
	};
		
	this.settings = jQuery.extend(true,{},defaults,options);
	this.init();
};

TotalGallery.prototype = {
	galleryContainerTemplate: '<div id="{id}" class="overlay hide {extraClass}"><ul class="{ulClass}">{content}</ul></div>',
	galleryTemplate: '<li id="gallery_{id}" class="{liClass}"><img src="{src}"/></li>',

	init: function(){
		// var galleryContainer = (typeof this.settings.context === "string") ? $(this.settings.fullScreenSelector,this.settings.context) : this.settings.context.find(this.settings.fullScreenSelector),
		var config = (typeof this.settings.context === "string") ? $(this.settings.selector,this.settings.context) : this.settings.context.find(this.settings.selector),
			content = $.parseJSON(config.text()).images,
			//targetSlide = target.parents(".slide"),
			//imagesToEnlarge = targetSlide.add(targetSlide.prev().add(targetSlide.next())),
			galleryContentHtml = "";

		for(var x=0,len=content.length; x < len; x++){
			console.log(x);
			var curr = content[x],
				bigImageSrc = (curr.bigImageSrc) ? curr.bigImageSrc : "placeholder.jpg",
				contentId = x+1;

			galleryContentHtml += this.galleryTemplate.supplant({
				id: contentId,
				src: bigImageSrc
			});
		};

		$("body").append(this.galleryContainerTemplate.supplant({
			id: this.settings.fullScreenId || "",
			extraClass: this.settings.fullScreenExtraClass || "",
			ulClass: this.settings.ulClass || "",
			content: galleryContentHtml
		}));

		this.gallery = $(this.settings.fullScreenSelector);
		this.slides = this.gallery.children().children("li");

		this.bindEvents();
	},

	bindEvents: function(){
		var _handleKeypress = function(e){
			var key = e.which;
			if(key === 37 || key === 39){
				if(key === 37){
					this.navigate("backward");
				}
				else{
					this.navigate("forward");
				}
			}
		};

		$("body").on("keyup",_handleKeypress.bind(this));
	},

	navigate: function(direction){
		var slideIdRegex = /gallery_(\d+)/,
			direction = direction || "forward",
			slideId = "";

		if(direction === "backward"){
			slideId = (this.activeSlideId == 1) ? this.getSlideId($(this.slides[(this.slides.length-1)])) : this.getSlideId(this.activeSlide.prev());
		}
		else{
			slideId = (this.activeSlideId == this.slides.length) ? this.getSlideId($(this.slides[0])) : this.getSlideId(this.activeSlide.next());
		}

		this.activateSlide(slideId);
	},

	showGallery: function(id){
		this.activateSlide(id);

		this.gallery.removeClass("hide");
	},

	activateSlide: function(id){
		this.slides.filter(".active").removeClass("active");
		this.slides.filter("#gallery_"+id).addClass("active");

		this.activeSlide = this.slides.filter(".active");
		this.activeSlideId = this.getSlideId(this.activeSlide);
	},

	getSlideId: function(jSlide){
		var slideIdRegex = /gallery_(\d+)/;

		return jSlide.prop("id").match(slideIdRegex)[1];
	}
};