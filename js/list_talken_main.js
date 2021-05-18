'use strict';

const GroupTokenId = 'e3b2a1cd48902e4a432c064f90b6dfa96c35482b82785aeebf498555483d458f';
const MinterAddr = 'simpleledger:qqjxqgmvde5z9shf92jyg24cvz2eagka8vh2jesqez';

const ec = new elliptic.ec('secp256k1');

let g = {
	account:{
		user:{ wif:'', prikey:'', pubkey:'', addr:'' },
		server:{ pubkey:'02157ef142926eccb005d88d2f9e2b4f1ca9975410c41112df711f64371eacf56a' },
		deposit:{ wif:'', prikey:'', pubkey:'', addr:'', balance:'Loading' },
		genesiser: { pubkey:'', addr:'', slpAddr:'', gpBalance:'Loading' },
		receiver: { addr:'' },
	},
	talkens:[],
	talkenIdExists:{},
};

jsbtc.asyncInit().then(()=>{
	loadLocalAccount();
	loadAccount();
	
	new Vue({
		el: '#app',
		data: {data:g},
		computed: {
			account:function() { return g.account; },
			talkens:function() { return g.talkens; },
		},
	});
});

loadTalkens().then(()=>{
	
});

async function signAndSendMessage(msg) {
	let msgString = JSON.stringify(msg);
	
	let sig = signMessage(msgString, g.account.user.wif);

	let req = JSON.stringify({ msg:msgString, sig:sig, });
	req = jsbtc.Buffer.from(req, 'utf8').toString('base64');

	let url = `https://us-central1-okinawatako.cloudfunctions.net/api/${req}`;
	let txHex = await httpFetch(url, true);
	
	let response = await sendRawTx(txHex);
	
	return response;
}

async function requestGp() {
	let feeUtxo = await getFeeUtxo(g.account.deposit.addr, 11111);
	if(!feeUtxo) {
		alert(`Something Error!\nSend at least 0.0003 BCH to your deposit address [${g.account.deposit.addr}]`);
		return;
	}
	let gpUtxo = await getGpUtxo(MinterAddr, true);
	if(!gpUtxo) {
		alert('Something Error!');
		return;
	}
	
	let msg = {
		userPubkey: g.account.user.pubkey,
		feeUtxo: feeUtxo,
		gpUtxo: gpUtxo,
		genesiserAddr: g.account.genesiser.addr,
	};
	
	await signAndSendMessage(msg);
}

async function postTalken(text) {
	let feeUtxo = await getFeeUtxo(g.account.deposit.addr, 1200);
	if(!feeUtxo) {
		alert(`Something Error!\nSend at least 0.00002 BCH to your deposit address [${g.account.deposit.addr}]`);
		return;
	}
	let gpUtxo = await getGpUtxo(g.account.genesiser.addr);
	if(!gpUtxo) {
		alert('Something Error!');
		loadBalance();
		return;
	}
	
	let msg = {
		userPubkey: g.account.user.pubkey,
		name: text,
		gpUtxo: gpUtxo,
		feeUtxo: feeUtxo,
		receiverAddr: g.account.receiver.addr,
	};
	
	await signAndSendMessage(msg);
}

function signMessage(msg, wif) {
	let hashed = jsbtc.sha256(msg, {hex:true});
	let signed = jsbtc.signBitcoinMessage(hashed, wif);
	return signed;
}

function storeLocalAccount() {
	let data = {
		userWif: g.account.user.wif,
		receiverAddr: g.account.receiver.addr,
	};
	localStorage.setItem('accountData', JSON.stringify(data));
}
function loadLocalAccount() {
	let data = JSON.parse(localStorage.getItem('accountData') || '{}');
	g.account.user.wif = data.userWif || '';
	g.account.receiver.addr = data.receiverAddr || '';
}

function loadAccount() {
	if(!g.account.user.wif) return;
	
	g.account.user.prikey = jsbtc.wifToPrivateKey(g.account.user.wif);
	g.account.user.pubkey = jsbtc.privateToPublicKey(g.account.user.prikey);
	g.account.user.addr = bchaddr.toCashAddress(jsbtc.publicKeyToAddress(g.account.user.pubkey, {witnessVersion: null}));
	
	let keypair = ec.keyFromPublic(g.account.server.pubkey, 'hex');
	let point = keypair.getPublic().mul(g.account.user.prikey);
	g.account.deposit.prikey = point.getX().toString(16);
	g.account.deposit.wif = jsbtc.privateKeyToWif(g.account.deposit.prikey);
	g.account.deposit.pubkey = jsbtc.privateToPublicKey(g.account.deposit.prikey);
	g.account.deposit.addr = bchaddr.toCashAddress(jsbtc.publicKeyToAddress(g.account.deposit.pubkey, {witnessVersion: null}));

	let hashed = jsbtc.sha256(g.account.user.pubkey, {hex:true});
	g.account.genesiser.pubkey = jsbtc.publicKeyAdd(g.account.server.pubkey, hashed);
	g.account.genesiser.addr = bchaddr.toCashAddress(jsbtc.publicKeyToAddress(g.account.genesiser.pubkey, {witnessVersion: null}));

	if(!g.account.receiver.addr) {
		let decoded = cashaddr.decode(g.account.user.addr);
		let encoded = cashaddr.encode('simpleledger', decoded.type, decoded.hash);
		g.account.receiver.addr = encoded;
	}
	
	loadBalance();
}

function loadBalance() {
	//g.account.deposit.balance = 'Loading';
	g.account.genesiser.gpBalance = 'Loading';
	getGpBalance(g.account.genesiser.addr).then((response)=>{
		g.account.genesiser.gpBalance = response;
	});
}

async function loadTalkens() {
	let talkens = await listTalkens(0);
	for(let i=0;i<talkens.length;++i) {
		if(g.talkenIdExists[talkens[i].id]) continue;
		
		g.talkenIdExists[talkens[i].id] = true;
		g.talkens.push(talkens[i]);
	}
}
