'use strict';

Vue.component('v_main', {
	template: `
		<main>
			<div class="panel">
				<textarea id="editor" placeholder="What's new"></textarea>
				<button class="post" v-if="account.genesiser.gpBalance>0" @click="onPostClick">Post [{{ account.genesiser.gpBalance }}]</button>
				<button class="post" v-if="account.genesiser.gpBalance<=0" @click="onRequestGpClick">Get some TalkenG to post</button>
				<button class="post" v-if="account.genesiser.gpBalance=='Loading'" disabled="disabled">…</button>
			</div>
		
			<v_talken_list :items="talkens"></v_talken_list>
		</main>
	`,
	props: ['account', 'talkens'],
	methods: {
		onPostClick: function() {
			let text = document.querySelector('#editor').value;
			postTalken(text).then(()=>{
				loadTalkens().then(()=>{});
			});
		},
		onRequestGpClick: function() {
			requestGp().then(()=>{
				loadBalance();
			});
		},
	},
});

