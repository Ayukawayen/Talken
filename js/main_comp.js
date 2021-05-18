'use strict';

Vue.component('v_main', {
	template: `
		<main>
			<div class="panel">
				<textarea id="editor" placeholder="What's new"></textarea>
				<button class="post" @click="onPostClick" :disabled="isPostDisabled">{{ account.genesiser.gpBalance | postButtonText }}</button>
			</div>
		
			<v_talken_list :items="talkens"></v_talken_list>
		</main>
	`,
	data:()=>({
		isPending: false,
	}),
	props: ['account', 'talkens'],
	computed: {
		isPostDisabled: function() {
			return this.isPending || this.account.genesiser.gpBalance=='Loading';
		},
	},
	filters: {
		postButtonText: function(value) {
			if(value == 'Loading') return '…';
			if(value > 0) return `Post [${value}]`;
			if(value <= 0) return 'Get some TalkenG to post';
			
			return '';
		},
	},
	methods: {
		onPostClick: function() {
			if(this.account.genesiser.gpBalance=='Loading') return;
			
			this.isPending = true;
			
			if(this.account.genesiser.gpBalance > 0) {
				let text = document.querySelector('#editor').value;
				postTalken(text).then(()=>{
					this.isPending = false;
					loadTalkens().then(()=>{});
				});
				return;
			}
			
			if(this.account.genesiser.gpBalance <= 0) {
				requestGp().then(()=>{
					this.isPending = false;
					loadBalance();
				});
				return;
			}
			
			this.isPending = false;
		},
	},
});

