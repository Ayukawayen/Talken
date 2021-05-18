'use strict';

Vue.component('v_talken_list', {
	template: `
		<div class="talkens">
			<div class="talken" v-for="item in items" >{{ item.name }}</div>
		</div>
	`,
	
	props: ['items'],
});

