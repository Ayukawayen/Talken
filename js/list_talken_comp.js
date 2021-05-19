'use strict';

Vue.component('v_talken_list', {
	template: `
		<div class="talkens">
			<div class="talken" v-for="item in items" >
				<div class="name">{{ item.name }}</div>
				<div class="tip" @click="onTipClick(item.id)"><span>Tip</span></div>
			</div>
		</div>
	`,
	
	props: ['items'],
	methods: {
		onTipClick: async function(tokenId) {
			let ownerAddr = await getTokenOwner(tokenId);
			let decoded = cashaddr.decode(ownerAddr);
			ownerAddr = cashaddr.encode('bitcoincash', decoded.type, decoded.hash);
			prompt('Send tip to:', ownerAddr);
		},
	},
});

