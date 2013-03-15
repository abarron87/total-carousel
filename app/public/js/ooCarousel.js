//Crockford's supplant.
if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(
            /\{([^{}]*)\}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

(function($){
	/*
		TotalCarousel constructor
	*/
	var TotalCarousel = function(element,options){
		this.carousel = $(element);
		this.defaults = {
			youtube: false, //whether to pull videos from youtube.
			height: 300,
			slideWidth: 440, //width in pixels of each carousel slide. Includes margin left and right.
			slideMargin: 20,
			navDisabledClass: "disabled", //class to add to disable clicking of navigation during animation.
			ytQuery: "arsenal goal compilations" //only for youtube:true. the query to send to YouTube API.
		};

		this.settings = $.extend({},this.defaults,options);
	};

	TotalCarousel.prototype = {
		slidePositions: [],
		slideTemplate: '<li id="slide{i}" class="slide {extraClass}"><div class="image"><img src="{src}" alt="{mediaTitle}"/></div><div class="metadata hide"><label>{mediaTitle}</label><div class="json hide">{expandedMedia}</div></div></li>',
		carouselTemplate: '<ol class="animated invisible">{slides}</ol>',
		playButtonTemplate: '<span class="icon-play play" style="{css}"></span>',
		expandButtonTemplate: '<span class="icon-expand expand"></span>',
		videoTemplate: '<iframe width="{width}" height="{height}" src="{src}" frameborder="0" allowfullscreen></iframe>',
		imageTemplate: '<img src="{src}" width="{width}" height="{height}"/>',

		/*
			Main method.
		*/
		init: function(){
			var galleryWidth = this.getWidth(),
				slideWidth = this.settings.slideWidth,
				slidesInView = Math.floor(galleryWidth/slideWidth) + 2; //whole slides + 1 either side.

			console.log("Gallery width: ",galleryWidth);
			console.log("Visible whole slides: ",galleryWidth/slideWidth);
			console.log("Slides in view: ",slidesInView);

			if(this.settings.youtube){
				this.getVideos({
					amount: slidesInView || 5,
					query: this.settings.ytQuery,
					callback: this.buildCarouselDOM
				});
			}
			else if(!this.settings.dynamic){
				var data = jQuery.parseJSON(this.carousel.children(".slideConfig").text());
				this.buildCarouselDOM(data);
			}
			else{
				this.completeSetup();
			}
		},

		/*
			Initialise the next/previous slide buttons.
		*/
		initNav: function(){
			var 
				_createNav = function(opts){
					var arrowTemplate = '<div class="{classes}"><a class="{iconClass}" href="#"></a></div>',
						arrow = arrowTemplate.supplant(opts);

					return arrow;
				},
				prevArrow = _createNav({
					classes: "nav prev",
					iconClass: "icon-arrow-left-2"
				}),
				nextArrow = _createNav({
					classes: "nav next",
					iconClass: "icon-arrow-right-2"
				});

			this.carousel.prepend(prevArrow).append(nextArrow);

		},

		/*
			Attach events to relevant DOM elements.
		*/
		bindEvents: function(){
			var
				_navClick = function(e){
					var target = $(e.target || e.srcElement);

					if(!target.hasClass(this.navDisabledClass)){
						var _slideCallback = function(){
							this.toggleNav("enable");
						}

						this.toggleNav("disable");
						if(target.parent().is(".next")){
							this.slide({
								direction: "forward",
								callbackFn: _slideCallback
							});
						}
						else if(target.parent().is(".prev")){
							this.slide({
								direction: "backward",
								callbackFn: _slideCallback
							});
						}
					}
					else{
						console.log("Nav disabled");
					}

					e.preventDefault();
				},
				_slideHover = function(e){
					var target = $(e.target || e.srcElement),
						targetParent = target.parent();

					console.log(e.type);

					if(target.hasClass("slide") || targetParent.hasClass("slide")){
						var metadata,
							expand;
						
						//Hide any that continue to show even after mouseleave is fired.
						if(e.type === "mouseenter"){
							var allMetadata = this.carousel.find(".metadata");

							allMetadata.each(function(i,el){
								var curr = $(this);
								
								if(el.style.display === "block"){
									el.style.display = "";
								}
							});
						}

						if(target.is("li")){
							metadata = target.children(".metadata");
							expand = target.children(".image").children(".expand");
						}
						else if(target.is("li .metadata")){
							metadata = target;
							expand = targetParent.children(".image").children(".expand");
						}
						else{
							metadata = targetParent.next(".metadata");
							expand = target.prev(".expand");
						}
						
						metadata.add(expand).toggleClass("hide");

					}

					// e.stopPropagation();
				},
				_imageClick = function(e){
					var target = $(e.target || e.srcElement);

					if(target.hasClass("slide") || target.parents("li").hasClass("slide")){
						var directionAndDistance = this.calculateDirectionAndDistance(target.closest(".slide"));

						if(directionAndDistance){
							this.slide({
								amount: directionAndDistance.distance,
								direction: directionAndDistance.direction
							});
						}
					}
					e.preventDefault();
				},
				_videoClick = function(e){
					var target = $(e.target || e.srcElement);

					if(target.hasClass("play")){
						var overlay = $("#fullScreen"),
							videoSrc = $.parseJSON(target.siblings(".metadata").children(".json").text()).video;

						overlay.children(".image").html(this.videoTemplate.supplant({
							width: "1280",
							height: "720",
							src: videoSrc
						}));

						overlay.fitVids();
						overlay.addClass("fadeInDown").removeClass("hide");
					}

					e.preventDefault();
				},
				_goFullscreen = function(e){
					var target = $(e.target || e.srcElement);

					if(target.hasClass("expand")){
						var overlay = $("#fullScreen"),
							bigImageSrc = $.parseJSON(target.parent().next().children(".json").text()).largeImage;

						overlay.children(".image").html(this.bigImageTemplate.supplant({
							src: bigImageSrc
						}));

						overlay.removeClass("hide");
					}

					e.preventDefault();
				},
				_leaveFullScreen = function(e){
					var target = $(e.target || e.srcElement);

					if(target.is("#fullScreen")){
						target.children(".image").html("");
						target.addClass("hide");
					}

					e.preventDefault();
				};

			$(window).resize(function(){console.log("window resized to "+$(this).width())});

			this.carousel.on("click",".nav",_navClick.bind(this));
			this.carousel.on("click",".slide",_imageClick.bind(this));
			this.carousel.on("click",".expand",_goFullscreen.bind(this));
			this.carousel.on("click",".play",_videoClick.bind(this));
			$("body").on("click","#fullScreen",_leaveFullScreen.bind(this));
			// this.on("mouseenter mouseleave",".slide",slideHover.bind(this));
		},


		/*
			Build up slide markup if carousel is dynamically populated.
		*/
		buildCarouselDOM: function(data){
			var self = this,
				slidesHTML = "",
				imgCount = self.getSlideCount(data);

			if(this.settings.youtube){
				var videos = data ? data : [],
					videoContent = this.getVideoContent(videos);

				jQuery.each(videoContent,function(i,el){
					slidesHTML += self.slideTemplate.supplant({
						i: (i+1).toString(),
						extraClass: "video",
						src: el.thumbnailURL || "",
						mediaTitle: el.videoTitle || "",
						expandedMedia: '{ "video": "'+el.videoURL+'" }'
					});
				});
			}
			else if(!this.settings.dynamic){
				var slides = data && data.images ? data.images : {};

				jQuery.each(slides,function(i,el){
					slidesHTML += self.slideTemplate.supplant({
						i: (i+1).toString(),
						extraClass: "",
						src: el.src || "",
						mediaTitle: el.slideTitle || "",
						expandedMedia: '{ "large": "" }'
					});
				});
				//Flickr/other service.
			}

			self.carousel.append(self.carouselTemplate.supplant({ slides: slidesHTML }));

			self.carousel.find(".slide img").load(function(){
				imgCount--;
				if(imgCount === 0){
					self.imagesLoaded = true;
				}				
			});

			self.completeSetup();
		},

		/*
			When slides are present in carousel, complete the initialisation process.
		*/
		completeSetup: function(){
			this.setState();

			console.log(this.slidePositions);
			this.initNav();
			this.bindEvents();

			//wait for images to be fully loaded before displaying them.
			var interval = setInterval((function(tc){
				return function(){
					console.log("checking for images loaded....");
					if(tc.imagesLoaded){
						tc.hideLoader();
						tc.showCarousel();
						clearInterval(interval);
					}
				}
			})(this),200);
		},

		/*
			Handle animation in any direction, of any amount.
		*/
		slide: function(options){
			var self = this,
				direction = options.direction || "forward",
				amount = options.amount || 1,
				slidesToFiddle = [],
				slideWidth = this.settings.slideWidth,
				operator,
				jList;

			for(var i=0;i<amount;i++){
				var slideToFiddle = this.getSlide(direction);
				
				//change this - it gets all the li's twice.
				jList = this.cloneSlide({
					slideToFiddle: slideToFiddle,
					direction: direction
				});

				slidesToFiddle.push(slideToFiddle);
			}
				
			if(direction === "forward"){
				operator = "-";
			}
			else if(direction === "backward"){
				operator = "+";
			}

			jList.each(function(i){
				$(this).animate({
					left: operator+"="+(slideWidth*amount)
				}, 500, function(){
					//One more slide in DOM than slidePositions (due to clone)
					var lastSlideInDOM = (i === jList.length-1);

					//only run callback at the end.
					if(lastSlideInDOM){
						if(typeof options.callbackFn === "function"){
							options.callbackFn.apply(self,undefined);
						};

						//remove the originals that are now surplus.
						for(var j=0,len=slidesToFiddle.length;j<len;j++){
							self.domRemoveSlide(slidesToFiddle[j]);
						};

						self.setSlidePositions();
					}
				});
			});
		},

		/*
			When slide moves out of view (to left or right), needs to be cloned and put to the back/front of the queue.
		*/
		cloneSlide: function(options){
			var jList = this.carousel.children("ol"),
				slideToFiddle = options.slideToFiddle || null,
				direction = options.direction || "forward",
				oppFiddleSlideLeftEdge = parseInt(this.getSlidesLeftEdge(direction),10),
				clonedSlide = slideToFiddle.clone(),
				cloneSlideLeftEdge,
				method;

			if(direction === "forward"){
				cloneSlideLeftEdge = (oppFiddleSlideLeftEdge+this.settings.slideWidth);
				method = "append";
			}
			else if(direction === "backward"){
				cloneSlideLeftEdge = (oppFiddleSlideLeftEdge-this.settings.slideWidth);
				method = "prepend";
			}

			//Move first slide from front to back
			this.moveSlide({
				clonedSlide: clonedSlide,
				direction: direction
			});

			jList[method](clonedSlide.css("left",cloneSlideLeftEdge));

			return jList.children("li");

		},


		/*
			Method for calculating the amount of animation to action and which direction to move.
			Triggered when clicking a slide to move it to the centre of the viewport.
		*/
		calculateDirectionAndDistance: function(slide){
			var slides = this.carousel.find("li.slide"),
				slideCount = slides.length,
				centralSlide = $(slides[Math.floor(slideCount/2)]),
				slideLeftEdge = parseInt(slide.css("left"),10),
				centralSlideLeftEdge = parseInt(centralSlide.css("left"),10),
				directionSettings = {
					slideLeftEdge: slideLeftEdge,
					centralSlideLeftEdge: centralSlideLeftEdge
				},
				direction = this.calculateDirection(directionSettings);

			if(direction){
				return {
					direction: direction,
					distance: this.calculateDistance(directionSettings)
				};
			}
			else{
				return direction;
			}

		},

		/*
			Calculate the direction of the sliding animation.
		*/
		calculateDirection: function(settings){
			var slideLeftEdge = settings.slideLeftEdge,
				centralSlideLeftEdge = settings.centralSlideLeftEdge,
				direction = false;

			if(slideLeftEdge !== centralSlideLeftEdge){
				direction = (slideLeftEdge < centralSlideLeftEdge) ? "backward" : "forward";
			}

			return direction;
		},

		/*
			Calculate the amount of sliding animation to carry out.
		*/
		calculateDistance: function(settings){
			var slideLeftEdge = settings.slideLeftEdge,
				centralSlideLeftEdge = settings.centralSlideLeftEdge,
				difference = (centralSlideLeftEdge-slideLeftEdge);

			//if difference/slideWidth is negative (because clicked slide is ahead of central slide), we don't care
			//so remove the minus (get absolute value).
			return Math.abs(difference/this.settings.slideWidth);
		},

		/*
			Put cloned slide to the front or the back of the queue and delete the original from the array,
		*/
		moveSlide: function(settings){
			var direction = settings.direction || "forward";
				clonedSlide = settings.clonedSlide;

			if(direction === "forward"){
				this.slidePositions = this.slidePositions.slice(1);
				this.slidePositions.push(clonedSlide);
			}
			else if(direction === "backward"){
				this.slidePositions = this.slidePositions.slice(0,this.slidePositions.length-1);
				this.slidePositions.unshift(clonedSlide);
			}
		},

		/*
			Disable/enable navigation during a slide.
		*/
		toggleNav: function(action){
			var nav = this.carousel.find(".nav a");

			if(action === "enable"){
				nav.removeClass(this.navDisabledClass);
			}
			else if(action === "disable"){
				nav.addClass(this.navDisabledClass);
			}
		},

		/*
			Remove a slide from the DOM.
		*/
		domRemoveSlide: function(slide){
			if(typeof slide !== "undefined" && slide instanceof jQuery){
				slide.remove();
			}
			else{
				console.log("Either slide not given or is not a jQuery object");
			}
		},

		/*
			Show the carousel.
		*/
		showCarousel: function(){
			//show carousel
			this.carousel.children("ol").removeClass("invisible").addClass("fadeInDown");
		},

		/*
			Hide loader
		*/
		hideLoader: function(){
			this.carousel.children(".loading").addClass("hide");
		},

		// GETTERS
		/*
			Retrieve videos from YouTube.
		*/
		getVideos: function(config){
			var self = this,
				apiKey = "AIzaSyC_DETaU_Zpv5jwG5FzpwqxVQqWoPYrHgw",
				queryString = self.settings.ytQuery.replace(/\s+/g,"+"),
				results;

			console.log("Query String: ",queryString);

			jQuery.get("https://gdata.youtube.com/feeds/api/videos",{
					"q": queryString,
					"orderby": "relevance",
					"v": "2",
					"alt": "json",
					"max-results": config.amount.toString(),
					"key": apiKey //Either put in settings or if using from Node, get from client.
				},
				function(data){
					var videos = (data && data.feed && data.feed.entry) ? data.feed.entry : undefined;
					console.log(data.feed.entry);

					if(typeof config.callback === "function"){
						config.callback.call(self,videos);
					}
				},
				"json"
			);
		},

		/*
			Get necessary video content from YouTube results.
		*/
		getVideoContent: function(videos){
			var videoContent = [];

			for(var i=0,len=videos.length;i<len;i++){
				var videoData = videos[i];
				videoContent.push({
					thumbnailURL: videoData["media$group"]["media$thumbnail"][2].url,
					videoTitle: videoData["title"]["$t"],
					videoURL: "https://www.youtube.com/embed/"+videoData["media$group"]["yt$videoid"]["$t"]+"/?autoplay=1"
				});
			}

			return videoContent;
		},

		/*
			Get a slide from the slidePositions array. Either grab the first or the last.
		*/
		getSlide: function(direction){
			var direction = direction || "forward",
				slideToReturn;

			if(direction === "forward"){
				slideToReturn = this.slidePositions[0];
			}
			else if(direction === "backward"){
				slideToReturn = this.slidePositions[this.slidePositions.length-1];
			}

			return slideToReturn;
		},

		/*
			Return the 'left' css value from the first or last slide.
		*/
		getSlidesLeftEdge: function(direction){
			var direction = direction || "forward",
				slideToPullFrom;

			if(direction === "forward"){
				slideToPullFrom = this.slidePositions[this.slidePositions.length-1];
			}
			else if(direction === "backward"){
				slideToPullFrom = this.slidePositions[0];
			}
			return slideToPullFrom.css("left");
		},

		/*
			Return width of carousel i.e. specifically the target of the jQuery plugin.
		*/
		getWidth: function(){
			return this.carousel.width();
		},

		/*
			Return image count/slide count depending on service used.
		*/
		getSlideCount: function(data){
			var slideCount;

			if(this.settings.youtube || this.settings.flickr){
				slideCount = data.length;
			}
			else if(!this.settings.dynamic){
				slideCount = data.images.length;
			}

			return slideCount;
		},

		// SETTERS
		/*
			Set start state of carousel. Trigger animation to slide first slide into the centre of the viewport.
			Set the width of the <ol> within carousel section.
			Add video/expand icons to relevant slides.
		*/
		setState: function(){
			var	self = this,
				list = self.carousel.children("ol"),
				slides = list.children(".slide"),
				leftEdge = 0,
				carouselHeight = self.settings.height,
				slideCount = slides.length,
				slideWidth = self.settings.slideWidth,
				slideMargin = self.settings.slideMargin;
				//if even number move the width of half the amount of slides
				//else move another half a slide.
				centralSlide = (slideCount % 2 === 1) ? Math.floor(slideCount/2) : Math.floor(slideCount/2) - 0.5,
				totalWidth = (slides.length*slideWidth);

			//set height of carousel
			self.carousel.css("height",carouselHeight.toString()+"px");
			//set width of slide container to total width of all slides (including padding)
			list.css("width",totalWidth.toString()+"px");
			//set left margin to minus half the width of the list of slides.
			list.css("margin-left","-"+(totalWidth/2).toString()+"px");
			slides.each(function(){
				var li = $(this),
					img = li.children("div.image"),
					imgHeight = img.height();

				img.children("img").css("width",(slideWidth-(slideMargin*2)).toString()+"px");

				li.css({
					"left": leftEdge,
					"margin": "0 "+slideMargin.toString()+"px"
				});
				
				leftEdge += slideWidth;


				if(li.hasClass("video")){
					var playHeight = carouselHeight*0.2;
					li.prepend(self.playButtonTemplate.supplant({
						css: "font-size:"+playHeight+"px;height:"+playHeight+"px;margin-top:-"+(playHeight/2)+"px;"
					}));
				}
				else{
					img.prepend(self.expandButtonTemplate);
				}

				// li.children(".metadata").show();
				self.setSlidePositions(li);
			});

			console.log("Amount of movement to centralise first slide: ",centralSlide);
			//put first slide in the middle.
			self.slide({
				direction: "backward",
				amount: centralSlide
			});
		},

		/*
			Setup/configure slidePositions array, either for the whole carousel (when resetting it) or
			adding individual slides at the initialisation of the carousel.
		*/
		setSlidePositions: function(li){
			var self = this;

			if(typeof li !== "undefined" && li instanceof jQuery){
				self.slidePositions.push(li);
			}
			else{
				var list = this.carousel.children("ol");

				self.slidePositions = [];
				list.children("li").each(function(){
					self.slidePositions.push($(this));
				});
			}
		}
	}

	/*
		jQuery plugin wrapper and creation of carousel instance.
	*/
	$.fn.totalCarousel = function(options){
		return this.each(function(){
			var totalCarousel = new TotalCarousel(this,options);

			totalCarousel.init();
		});
	};
})(jQuery);
