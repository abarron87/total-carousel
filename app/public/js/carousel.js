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
	var methods = {
			init: function(options){
				var settings = {
					youtube: false,
					slideWidth: 440,
					navDisabledClass: "disabled"
				};

				if(options){
					$.extend(settings,options);
				}

				this.data("settings",settings);
				return this.each(function(){
					var jThis = $(this),
						galleryWidth = $(window).width(), //including margins, padding
						slideWidth = jThis.data("settings").slideWidth,
						slidesInView = Math.floor(galleryWidth/slideWidth) + 2; //whole slides + 1 either side.

					console.log("Gallery width: ",galleryWidth);
					console.log("Visible whole slides: ",galleryWidth/slideWidth);
					console.log("Slides in view: ",slidesInView);

					if(jThis.data("settings").youtube){
						jThis.carousel("getVideos",{
							amount: slidesInView || 5,
							callback: "buildCarouselDOM"
						});
					}
					else{
						jThis.carousel("completeSetup");
					}
					// console.log(this);
				});
			},

			buildCarouselDOM: function(data){
				var jThis = this,
					slideTemplate = '<li id="slide{i}" class="slide {extraClass}"><div class="image"><img src="{src}" alt="{mediaTitle}"/></div><div class="metadata hide"><label>{mediaTitle}</label><div class="json hide">{expandedMedia}</div></div></li>',
					carouselHTML = '<ol class="animated">{slides}</ol>',
					slidesHTML = "";

				if(jThis.data("settings").youtube){
					var videos = (data && data.feed && data.feed.entry) ? data.feed.entry : [],
						videoContent = this.carousel("getVideoContent",videos);

					jQuery.each(videoContent,function(i,el){
						slidesHTML += slideTemplate.supplant({
							i: (i+1).toString(),
							extraClass: "video",
							src: el.thumbnailURL || "",
							mediaTitle: el.videoTitle || "",
							expandedMedia: '{ "video": "'+el.videoURL+'" }'
						})
					});
				}

				jThis.html(carouselHTML.supplant({ slides: slidesHTML }));

				jThis.carousel("completeSetup");
			},

			completeSetup: function(){
				this.carousel("setState");

				console.log(slidePositions);
				this.carousel("initNav");
				this.carousel("bindEvents");

				// this.carousel("showCarousel");
			},

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

			setState: function(){
				var	jThis = this,
					list = jThis.children("ol"),
					slides = list.children(".slide"),
					leftEdge = 0,
					slideCount = slides.length,
					slideWidth = jThis.data("settings").slideWidth,
					//if even number move the width of half the amount of slides
					//else move another half a slide.
					centralSlide = (slideCount % 2 === 1) ? Math.floor(slideCount/2) : Math.floor(slideCount/2) - 0.5,
					totalWidth = (slides.length*slideWidth);

				//set width of slide container to total width of all slides (including padding)
				list.css("width",totalWidth.toString()+"px");
				//set left margin to minus half the width of the list of slides.
				list.css("margin-left","-"+(totalWidth/2).toString()+"px");
				slides.each(function(){
					var li = $(this),
						img = li.children("div.image"),
						imgHeight = img.height();

					li.css("left",leftEdge);
					// img.css("margin-top","-"+(imgHeight/2)+"px");
					leftEdge += slideWidth;


					if(li.hasClass("video")){
						li.prepend("<span class='icon-play play'></span>");
					}
					else{
						img.prepend("<span class='icon-expand expand'></span>");
					}

					// li.children(".metadata").show();
					jThis.carousel("setSlidePositions",li);
				});

				console.log("Amount of movement to centralise first slide: ",centralSlide);
				//put first slide in the middle.
				jThis.carousel("slide",{
					direction: "backward",
					amount: centralSlide
				});
			},

			initNav: function(){
				var createNav = function(opts){
						var arrowTemplate = '<div class="{classes}"><a class="{iconClass}" href="#"></a></div>',
							arrow = arrowTemplate.supplant(opts);

						return arrow;

					},
					prevArrow = createNav({
						classes: "nav prev",
						iconClass: "icon-arrow-left-2"
					}),
					nextArrow = createNav({
						classes: "nav next",
						iconClass: "icon-arrow-right-2"
					});

				$(this).prepend(prevArrow).append(nextArrow);

			},

			bindEvents: function(){
				var
					navClick = function(e){
						var jThis = $(this),
							target = $(e.target || e.srcElement);

						if(!target.hasClass(navDisabledClass)){
							var slideCallback = function(){
								jThis.carousel("toggleNav","enable");
							}

							jThis.carousel("toggleNav","disable");
							if(target.parent().is(".next")){
								jThis.carousel("slide",{
									direction: "forward",
									callbackFn: slideCallback
								});
							}
							else if(target.parent().is(".prev")){
								jThis.carousel("slide",{
									direction: "backward",
									callbackFn: slideCallback
								});
							}
						}
						else{
							console.log("Nav disabled");
						}

						e.preventDefault();
					},
					slideHover = function(e){
						var jThis = $(this),
							target = $(e.target || e.srcElement),
							targetParent = target.parent();

						console.log(e.type);

						if(target.hasClass("slide") || targetParent.hasClass("slide")){
							var metadata,
								expand;
							
							//Hide any that continue to show even after mouseleave is fired.
							if(e.type === "mouseenter"){
								var allMetadata = jThis.find(".metadata");

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
					imageClick = function(e){
						var jThis = $(this),
							target = $(e.target || e.srcElement);

						if(target.hasClass("slide") || target.parents("li").hasClass("slide")){
							var directionAndDistance = jThis.carousel("calculateDirectionAndDistance",target.closest(".slide"));

							if(directionAndDistance){
								jThis.carousel("slide",{
									amount: directionAndDistance.distance,
									direction: directionAndDistance.direction
								});
							}
						}
						e.preventDefault();
					},
					videoClick = function(e){
						var jThis = $(this),
							target = $(e.target || e.srcElement);

						if(target.hasClass("play")){
							var videoTemplate = '<iframe width="{width}" height="{height}" src="{src}" frameborder="0" allowfullscreen></iframe>',
								overlay = $("#fullScreen");
								var videoSrc = $.parseJSON(target.siblings(".metadata").children(".json").text()).video;

							overlay.children(".image").html(videoTemplate.supplant({
								width: "1280",
								height: "720",
								src: videoSrc
							}));

							overlay.fitVids();
							overlay.removeClass("hide");
						}

						e.preventDefault();
					},
					goFullscreen = function(e){
						var jThis = $(this),
							target = $(e.target || e.srcElement);

						if(target.hasClass("expand")){
							var imageTemplate = '<img src="{src}" width="{width}" height="{height}"/>',
								overlay = $("#fullScreen"),
								bigImageSrc = $.parseJSON(target.parent().next().children(".json").text()).largeImage;

							overlay.children(".image").html(imageTemplate.supplant({
								src: bigImageSrc
							}));

							overlay.removeClass("hide");
						}

						e.preventDefault();
					},
					leaveFullScreen = function(e){
						var target = $(e.target || e.srcElement);

						if(target.is("#fullScreen")){
							target.children(".image").html("");
							target.addClass("hide");
						}

						e.preventDefault();
					};

				$(window).resize(function(){console.log("window resized to "+$(this).width())});
				this.on("click",".nav",navClick.bind(this));
				this.on("click",".slide",imageClick.bind(this));
				this.on("click",".expand",goFullscreen.bind(this));
				this.on("click",".play",videoClick.bind(this));
				$("body").on("click","#fullScreen",leaveFullScreen.bind(this));
				// this.on("mouseenter mouseleave",".slide",slideHover.bind(this));
			},

			getVideos: function(config){
				var jThis = this,
					apiKey = "AIzaSyC_DETaU_Zpv5jwG5FzpwqxVQqWoPYrHgw",
					results;

				jQuery.get("https://gdata.youtube.com/feeds/api/videos",{
						"q": "arsenal+goal+compilations",
						"orderby": "relevance",
						"v": "2",
						"alt": "json",
						"max-results": config.amount.toString(),
						"key": apiKey
					},
					function(data){
						console.log(data.feed.entry);
						jThis.carousel(config.callback,data);
					},
					"json"
				);
			},

			slide: function(options){
				var jThis = this,
					direction = options.direction || "forward",
					amount = options.amount || 1,
					slidesToFiddle = [],
					slideWidth = jThis.data("settings").slideWidth,
					operator;

				for(var i=0;i<amount;i++){
					var slideToFiddle = jThis.carousel("getSlide",direction),
						jList = jThis.carousel("cloneSlide",{
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

				jThis.children("ol").children("li").each(function(i){
					$(this).animate({
						left: operator+"="+(slideWidth*amount)
					}, 500, function(){
						//One more slide in DOM than slidePositions (due to clone)
						var lastSlideInDOM = (i === jList.length-1);

						//only run callback at the end.
						if(lastSlideInDOM){
							if(typeof options.callbackFn === "function"){
								options.callbackFn.apply(jThis,undefined);
							};

							//remove the originals that are now surplus.
							for(var j=0,len=slidesToFiddle.length;j<len;j++){
								jThis.carousel("domRemoveSlide",slidesToFiddle[j]);
							};

							jThis.carousel("setSlidePositions");
						}
					});
				});
			},

			toggleNav: function(action){
				var nav = this.find(".nav a");

				if(action === "enable"){
					nav.removeClass(navDisabledClass);
				}
				else if(action === "disable"){
					nav.addClass(navDisabledClass);
				}
			},

			cloneSlide: function(options,slideToFiddle,direction){
				var jThis = this,
					jList = this.children("ol"),
					slideToFiddle = options.slideToFiddle || null,
					direction = options.direction || "forward",
					oppFiddleSlideLeftEdge = parseInt(jThis.carousel("getSlidesLeftEdge",direction),10),
					clonedSlide = slideToFiddle.clone(),
					cloneSlideLeftEdge,
					method;

				if(direction === "forward"){
					cloneSlideLeftEdge = (oppFiddleSlideLeftEdge+slideWidth);
					method = "append";
				}
				else if(direction === "backward"){
					cloneSlideLeftEdge = (oppFiddleSlideLeftEdge-slideWidth);
					method = "prepend";
				}

				//Move first slide from front to back
				jThis.carousel("moveSlide",clonedSlide,direction);

				jList[method](clonedSlide.css("left",cloneSlideLeftEdge));

				return jList.children("li");

			},

			getSlidesLeftEdge: function(direction){
				var direction = direction || "forward",
					slideToPullFrom;
				if(direction === "forward"){
					slideToPullFrom = slidePositions[slidePositions.length-1];
				}
				else if(direction === "backward"){
					slideToPullFrom = slidePositions[0];
				}
				return slideToPullFrom.css("left");
			},

			getSlide: function(direction){
				var direction = direction || "forward",
					slideToReturn;

				if(direction === "forward"){
					slideToReturn = slidePositions[0];
				}
				else if(direction === "backward"){
					slideToReturn = slidePositions[slidePositions.length-1];
				}

				return slideToReturn;
			},

			moveSlide: function(clonedSlide,direction){
				if(typeof direction !== "undefined" && direction === "forward"){
					slidePositions = slidePositions.slice(1);
					slidePositions.push(clonedSlide);
				}
				else if((typeof direction === "undefined") || (typeof direction !== "undefined" && direction === "backward")){
					slidePositions = slidePositions.slice(0,slidePositions.length-1);
					slidePositions.unshift(clonedSlide);
				}
			},

			domRemoveSlide: function(slide){
				if(typeof slide !== "undefined" && slide instanceof jQuery){
					slide.remove();
				}
				else{
					console.log("Either slide not given or is not a jQuery object");
				}
			},

			setSlidePositions: function(li){
				if(typeof li !== "undefined" && li instanceof jQuery){
					slidePositions.push(li);
				}
				else{
					var list = this.children("ol");

					slidePositions = [];
					list.children("li").each(function(){
						slidePositions.push($(this));
					});
				}
			},

			calculateDirectionAndDistance: function(slide){
				var jThis = this,
					slides = this.find("li.slide"),
					slideCount = slides.length,
					centralSlide = $(slides[Math.floor(slideCount/2)]),
					slideLeftEdge = parseInt(slide.css("left"),10),
					centralSlideLeftEdge = parseInt(centralSlide.css("left"),10),
					directionSettings = {
						slideLeftEdge: slideLeftEdge,
						centralSlideLeftEdge: centralSlideLeftEdge
					},
					direction = jThis.carousel("calculateDirection",directionSettings);

				if(direction){
					return {
						direction: direction,
						distance: jThis.carousel("calculateDistance",directionSettings)
					};
				}
				else{
					return direction;
				}

			},

			calculateDirection: function(settings){
				var slideLeftEdge = settings.slideLeftEdge,
					centralSlideLeftEdge = settings.centralSlideLeftEdge,
					direction = false;

				if(slideLeftEdge !== centralSlideLeftEdge){
					direction = (slideLeftEdge < centralSlideLeftEdge) ? "backward" : "forward";
				}

				return direction;
			},

			calculateDistance: function(settings){
				var slideLeftEdge = settings.slideLeftEdge,
					centralSlideLeftEdge = settings.centralSlideLeftEdge,
					difference = (centralSlideLeftEdge-slideLeftEdge);

				//if difference/slideWidth is negative (because clicked slide is ahead of central slide), we don't care
				//so remove the minus (get absolute value).
				return Math.abs(difference/slideWidth);
			},

			showCarousel: function(){
				//show carousel
				this.children("ol").removeClass("invisible").addClass("fadeInDown");
			}
		},
		slidePositions = [];

	$.fn.carousel = function(method){
		if (methods[method]) {
	    	return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
	    }
	    else if(typeof method === 'object' || !method){
	    	return methods.init.apply(this,arguments);
	    }
	    else{
	    	$.error('Method '+ method+' does not exist on jQuery.carousel');
	    } 
	};

	$.fn.carousel.settings = {
		youtube: false
	};
})(jQuery);




// $.ajax({  
//         url : "https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&screen_name=abarron87&count=2",  
//         dataType : "json",  
//         timeout:15000,  
//         success : function(data)  
//         {  
//               console.log("Data successfully obtained! <br />:",data);  
//  // for (i=0; i<data.length; i++)  
//  //            {  
//  // $("#data").append("<p>" + data[i].text) +"</p>";  
//  // $("#data").append("<p>" + data[i].created_at +"</p>");  
//  //            }  
//         },  
//         error : function()  
//         {  
//             alert("Failure!");  
//         },  
//     }); 