class Funny_Post_Data {

	constructor(post_id = 0, data = {}){
		this._post_id = parseInt(post_id, 10) || 0;
		this._data = Object.assign(Object.create(null), {

			u: (data && data.u && Array.isArray(data.u))? data.u : [],
			l: (data && data.u && Array.isArray(data.l))? data.l : []

		});
	}

	get post_id(){
		return this._post_id;
	}

	get data(){
		return this._data;
	}

	contains(user_id){
		if($.inArrayLoose(user_id, this._data.u) > -1){
			return true;
		}

		return false;
	}

	add(user_id, name){
		if(this._data.l.length > 5){
			this._data.l.pop();
		}

		this._data.l.unshift({

			u: user_id,
			n: name

		});

		this._data.u.push(user_id);

		yootil.key.set(Funny_Post.PLUGIN_POST_KEY, this._data, this._post_id);
	}

	remove(user_id){
		let idx = -1;

		for(let i = 0; i < this._data.l.length; ++ i){
			if(this._data.l[i].u == user_id){
				idx = i;
				break;
			}
		}

		if(idx > -1){
			this._data.l.splice(idx, 1);
		}

		let idx2 = $.inArrayLoose(user_id, this._data.u);

		if(idx2 > -1){
			this._data.u.splice(idx2, 1);
		}

		yootil.key.set(Funny_Post.PLUGIN_POST_KEY, this._data, this._post_id);
	}

}