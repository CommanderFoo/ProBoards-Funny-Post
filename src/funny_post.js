class Funny_Post {

	static init(){
		if(typeof yootil == "undefined"){
			console.warn("The plugin \"Funny Post\" needs Yootil.");

			return;
		}

		this.PLUGIN_ID = "pd_funny_post";
		this.PLUGIN_POST_KEY = "pd_funny_post";
		this.PLUGIN_USER_KEY = "pd_funny_user";
		this.LOOKUP = new Map();
		this.using_custom = false;

		this.IMAGES = {};
		this.SETTINGS = {};

		this.thread_check = (

			yootil.location.recent_posts() ||
			yootil.location.search_results() ||
			yootil.location.thread()

		);

		this.setup();

		$(this.ready.bind(this));
	}

	static ready(){
		if(this.thread_check){
			yootil.event.after_search(() => {

				this.create_elements.bind(this)();
				this.create_funny_reactions.bind(this)();

			});

			this.create_elements();
			this.create_funny_reactions();
		}
	}

	static setup(){
		let plugin = pb.plugin.get(this.PLUGIN_ID);

		if(plugin && plugin.settings){
			this.SETTINGS = plugin.settings;
			this.IMAGES = plugin.images;

			if(this.thread_check){
				let post_data = proboards.plugin.keys.data[this.PLUGIN_POST_KEY];

				for(let key in post_data){
					this.LOOKUP.set(parseInt(key, 10), new Funny_Post_Data(key, post_data[key]));
				}
			}
		}
	}

	static get_data(post_id){
		post_id = parseInt(post_id, 10);

		if(!this.LOOKUP.has(post_id)){
			this.LOOKUP.set(post_id, new Funny_Post_Data(post_id));
		}

		return this.LOOKUP.get(post_id);
	}

	static create_elements(){
		let $posts = $("tr.item[id^=post-]");

		$posts.each(function(){
			let post_id = Funny_Post.fetch_post_id(this);
			let $content = $(this).find("td.content");
			let post_created_by = parseInt(pb.data("proboards.post")[post_id].created_by, 10);

			Funny_Post.show_in_mini_profile($(this).find(".mini-profile"), post_created_by);

			if($content.length == 1 && post_id){
				let user_id = yootil.user.id();

				let data = Funny_Post.get_data(post_id);
				let opacity = (data.contains(user_id))? 1 : 0.3;
				let $container = $("<div data-funny-post='" + post_id + "' class='funny-post-container'></div>");
				let $info = $("<span data-funny-post='" + post_id + "' class='funny-post-info'></span>");
				let $button = $("<img data-funny-post='" + post_id + "' class='funny-post-button' />");

				$button.attr("src", ((Funny_Post.SETTINGS.funny_image)? Funny_Post.SETTINGS.funny_image : Funny_Post.IMAGES.lol));
				$button.css("opacity", opacity);

				$button.on("mouseover", () => {

					$button.css("opacity", 1);

				});

				$button.on("mouseout", () => {

					if(data.contains(user_id)){
						opacity = 1;
					} else {
						opacity = 0.5;
					}

					$button.css("opacity", opacity);

				});

				$button.on("click", Funny_Post.button_handler.bind($button, post_id, user_id, post_created_by));

				$container.append($info);
				$container.append($button);
				$content.append($container);
			}
		});
	}

	static button_handler(post_id, user_id, post_created_by){
		if(!yootil.key.write(Funny_Post.PLUGIN_POST_KEY, post_id)){
			pb.window.alert("Permission Denied", "You do not have the permission to write to the key for the Funny Post plugin.");
			return false;
		} else if(yootil.key.space_left(Funny_Post.PLUGIN_POST_KEY) <= 35){
			pb.window.alert("Post Key Full", "Unfortunately your reaction cannot be saved for this post, as it is out of space.");
			return false;
		}

		let post_data = Funny_Post.get_data(post_id);
		let has_loled = (post_data && post_data.contains(user_id))? true : false;

		if(!has_loled){
			Funny_Post.add(post_id, user_id);

			if(post_created_by && (post_created_by != user_id || Funny_Post.SETTINGS.own_post_increment == 1)){
				Funny_Post.increment_user_count(post_created_by);
			}
		} else {
			Funny_Post.remove(post_id, user_id);

			if(post_created_by && (post_created_by != user_id || Funny_Post.SETTINGS.own_post_increment == 1)){
				Funny_Post.decrement_user_count(post_created_by);
			}
		}

		return false;
	}

	static create_funny_reactions(){
		this.LOOKUP.forEach((val, key, m) => {

			this.update_post(key);

		});
	}

	static add(post_id, user_id){
		$(".funny-post-button[data-funny-post='" + post_id + "']").css("opacity", 1);

		let post_data = Funny_Post.get_data(post_id);

		post_data.add(user_id, yootil.user.name());

		Funny_Post.update_post(post_id);
	}

	static remove(post_id, user_id){
		let post_data = Funny_Post.get_data(post_id);

		post_data.remove(user_id);

		this.update_post(post_id);

		$(".funny-post-button[data-funny-post='" + post_id + "']").css("opacity", .3);
	}

	static fetch_post_id(post){
		let post_id_parts = ($(post).attr("id") || "").split("-");

		if(post_id_parts && post_id_parts.length == 2){
			return parseInt(post_id_parts[1], 10);
		}

		return 0;
	}

	static update_post(post_id){
		let data = Funny_Post.get_data(post_id).data;
		let $info = $(".funny-post-info[data-funny-post='" + post_id + "']");

		if($info.length == 1){
			$info.empty();

			if(data.u.length > 0){
				let $elem = $("<span class='funny-post-loled'></span>");
				let html = "";

				if(data.l.length > 0){
					for(let i = 0; i < data.l.length; ++ i){
						let user_id = parseInt(data.l[i].u, 10);
						let name = yootil.html_encode(data.l[i].n, true);

						html += "<a href='/user/" + user_id + "' class='user-link js-user-link user-" + user_id + "' itemprop='url'><span itemprop='name'>" + name + "</span></a>";

						if(i < (data.l.length - 1)){
							html += ",";
						}

						html += " ";
					}
				}

				if(data.l.length == 0 && data.u.length > 0){
					html += data.u.length;
				} else if(data.u.length > data.l.length){
					html += "and " + (data.u.length - data.l.length) + " more";
				}

				html += Funny_Post.SETTINGS.laughed_at;

				$elem.html(html);

				$info.append($elem);
			}
		}
	}

	static show_in_mini_profile($mini_profile, post_created_by){
		let $elem = $mini_profile.find(".funny-posts-count");
		let $info = $mini_profile.find(".info");

		if(!$elem.length && !$info.length){
			console.warn("Funny Post: No info element found.");

			return;
		}

		let using_info = false;

		if($elem.length){
			this.using_custom = true;
		} else {
			using_info = true;
			$elem = $("<div class='funny-post-count'></div>");
		}

		let count = yootil.key.value(Funny_Post.PLUGIN_USER_KEY, post_created_by) || 0;
		let html = "<span class='funny-post-count'>" + Funny_Post.SETTINGS.mini_profile + "<span>" + count + "</span></span><br />";

		$elem.html(html);

		if(using_info){
			$info.prepend($elem);
		}

		$elem.show();
	}

	static increment_user_count(user_id){
		let current = parseInt(yootil.key.value(Funny_Post.PLUGIN_USER_KEY, user_id), 10) || 0;

		yootil.key.set(Funny_Post.PLUGIN_USER_KEY, current + 1, user_id);
	}

	static decrement_user_count(user_id){
		let current = parseInt(yootil.key.value(Funny_Post.PLUGIN_USER_KEY, user_id), 10) || 0;

		if(current > 0){
			yootil.key.set(Funny_Post.PLUGIN_USER_KEY, current - 1, user_id);
		}
	}

}