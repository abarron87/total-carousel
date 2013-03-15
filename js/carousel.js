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
			init: function(){
				return this.each(function(){
					var jThis = $(this),
						list = jThis.children("ol"),
						slides = list.children(".slide"),
						leftEdge = 0,
						slideCount = slides.length,
						centralSlide = Math.floor(slideCount/2);

					//set width of slide container to total width of all slides (including padding)
					list.css("width",(slides.length*slideWidth).toString()+"px");
					slides.each(function(){
						var li = $(this),
							img = li.children("div.image"),
							imgHeight = img.height();

						li.css("left",leftEdge);
						img.css("margin-top","-"+(imgHeight/2)+"px");
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

					console.log(slidePositions);
					jThis.carousel("initNav");
					jThis.carousel("bindEvents");

					//put first slide in the middle.
					jThis.carousel("slide",{
						direction: "backward",
						amount: centralSlide
					});

					//show carousel
					list.removeClass("invisible").addClass("fadeInDown");

					// console.log(this);
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

						e.preventDefault();
					};

				this.on("click",".nav",navClick.bind(this));
				this.on("click",".slide",imageClick.bind(this));
				// this.on("mouseenter mouseleave",".slide",slideHover.bind(this));
			},

			slide: function(options){
				var jThis = this,
					direction = options.direction || "forward",
					amount = options.amount || 1,
					slidesToFiddle = [],
					operator;

				for(var i=0;i<amount;i++){
					var slideToFiddle = jThis.carousel("getSlide",direction),
						jList = jThis.carousel("cloneSlide",slideToFiddle,direction);

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

			cloneSlide: function(slideToFiddle,direction){
				var jThis = this,
					jList = this.children("ol"),
					oppFiddleSlideLeftEdge = parseInt(jThis.carousel("getSlidesLeftEdge",direction),10),
					clonedSlide = slideToFiddle.clone(),
					cloneSlideLeftEdge,
					method;

				if(typeof direction !== "undefined" && direction === "forward"){
					cloneSlideLeftEdge = (oppFiddleSlideLeftEdge+slideWidth);
					method = "append";
				}
				else if((typeof direction === "undefined") || (typeof direction !== "undefined" && direction === "backward")){
					cloneSlideLeftEdge = (oppFiddleSlideLeftEdge-slideWidth);
					method = "prepend";
				}

				//Move first slide from front to back
				jThis.carousel("moveSlide",clonedSlide,direction);

				jList[method](clonedSlide.css("left",cloneSlideLeftEdge));

				return jList.children("li");

			},

			getSlidesLeftEdge: function(direction){
				var slideToPullFrom;
				if(typeof direction !== "undefined" && direction === "forward"){
					slideToPullFrom = slidePositions[slidePositions.length-1];
				}
				else if((typeof direction === "undefined") || (typeof direction !== "undefined" && direction === "backward")){
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
			}
		},
		slidePositions = [],
		slideWidth = 440,
		navDisabledClass = "disabled";

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