'use strict';

Vue.component('v_header', {
	template: `
		<header>
			<h1>Talken</h1>
			<div class="account" @click="setShow(true)">{{account.user.addr | shortAddr}}</div>
			<div class="prikey" :show="isShowPrikey">
				<div class="form">
					<button @click="setShow(false)">✕</button>
					<label>WIF Private Key</label>
					<input type="text" id="userWif" :value="account.user.wif" @change="onUserWifChange"/>
					<input type="text" id="userAddr" :value="account.user.addr" readonly="readonly"/>
					<label>Deposit Address</label>
					<input type="text" id="depositWif" :value="account.deposit.wif" readonly="readonly"/>
					<input type="text" id="depositAddr" :value="account.deposit.addr" readonly="readonly"/>
					<label>Talken Receiving Address</label>
					<input type="text" id="receiverAddr" :value="account.receiver.addr" @change="onReceiverAddrChange"/>
				</div>
			</div>
		</header>
	`,
	props: ['account'],
	
	data: ()=>({
		isShowPrikey:false,
	}),
	filters: {
		shortAddr: (addr)=>{
			if(!addr) return 'Login';
			
			let i = addr.indexOf(':')+1;
			return addr.substr(i,8);
		},
	},
	methods: {
		setShow: function(value) {
			this.isShowPrikey = value;
		},
		onUserWifChange: function() {
			g.account.user.wif = document.querySelector('#userWif').value;
			loadAccount();
			storeLocalAccount();
		},
		onReceiverAddrChange: function() {
			g.account.receiver.addr = document.querySelector('#receiverAddr').value;
			storeLocalAccount();
		},
	},
});

