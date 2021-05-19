'use strict';

async function listTalkens(skip) {
	skip = skip || 0;
	
	let query = {
		"v": 3,
		"q": {
			"db": ["g"],
			"aggregate":[{
				"$match": {
					"tokenDetails.nftGroupIdHex": GroupTokenId,
					"graphTxn.details.transactionType": "GENESIS",
				}
			},{
				"$lookup": {
					"from": "tokens",
					"localField": "tokenDetails.tokenIdHex",
					"foreignField": "tokenDetails.tokenIdHex",
					"as": "token"
				}
			}],
			"sort": {"_id":-1},
			"skip": skip,
			"limit": 100
		}
	};
	query = btoa(JSON.stringify(query));

	let url = `https://slpdb.fountainhead.cash/q/${query}`;

	let response = await httpFetch(url);
	
	if(!response) return false;
	if(!response.g) return false;
	if(!response.g.length) return false;
	
	let result = [];
	for(let i=0; i<response.g.length; ++i) {
		let item = response.g[i];
		result.push({
			id: item.tokenDetails.tokenIdHex,
			name: item.token[0].tokenDetails.name,
			timestamp_unix: item.token[0].tokenDetails.timestamp_unix,
			creator: item.graphTxn.outputs[0].address,
		});
	}
	
	return result;
}


async function getGpUtxos(addr, isMinter) {
	let decoded = cashaddr.decode(addr);
	addr = cashaddr.encode('simpleledger', decoded.type, decoded.hash);

	let query = {
		"v": 3,
		"q": {
			"db": ["g"],
			"aggregate": [{
				"$match": {
					"graphTxn.details.tokenIdHex": GroupTokenId,
					"graphTxn.outputs": {
						"$elemMatch": {
							"address": addr,
							"status": "UNSPENT",
							"slpAmount": isMinter ? { "$gt": 18 } : 1
						}
					}
				}
			}]
		}
	};
	query = btoa(JSON.stringify(query));

	let url = `https://slpdb.fountainhead.cash/q/${query}`;

	let response = await httpFetch(url);
	
	if(!response) return false;
	if(!response.g) return false;
	if(!response.g.length) return false;
	
	let result = [];
	for(let i=0; i<response.g.length; ++i) {
		let utxos = getGpUtxosFromGraph(response.g[i], addr, isMinter);
		if(!utxos) continue;
		
		result = result.concat(utxos);
	}
	
	return result;
}

function getGpUtxosFromGraph(graph, addr, isMinter) {
	if(!graph.graphTxn) return false;
	if(!graph.graphTxn.outputs) return false;
	if(!graph.graphTxn.outputs.length) return false;
	
	let utxos = graph.graphTxn.outputs;

	let result = [];
	for(let i=0; i<utxos.length; ++i) {
		let utxo = utxos[i];

		if(utxo.address != addr) continue;
		if(utxo.status != 'UNSPENT') continue;
		if(isMinter) {
			if(utxo.slpAmount < 18) continue;
		} else {
			if(utxo.slpAmount != 1) continue;
		}
		
		result.push({
			txId: graph.graphTxn.txid,
			txPos: utxo.vout,
			value: utxo.bchSatoshis,
		});
	}
	
	return result;
}

async function getFeeUtxo(addr, minValue) {
	let url = `https://api.fullstack.cash/v4/electrumx/utxos/${addr}`;

	let response = await httpFetch(url);

	if(!response) return false;
	if(!response.utxos) return false;
	if(response.utxos.length <= 0) return false;
	
	let utxos = response.utxos;
	
	for(let i=0; i<utxos.length; ++i) {
		let utxo = utxos[i];
		
		if(utxo.value < minValue) continue;
		
		return {
			txId: utxo.tx_hash,
			txPos: utxo.tx_pos,
			value: utxo.value,
		};
	}

	return false;
}


async function getTokenOwner(tokenId) {
	let url = `https://api.fullstack.cash/v4/slp/balancesForToken/${tokenId}`;

	let response = await httpFetch(url);

	if(!response) return false;
	if(response.length <= 0) return false;
	
	return response[0].slpAddress || false;
}

async function sendRawTx(txHex) {
	let url = `https://api.fullstack.cash/v4/rawtransactions/sendRawTransaction/${txHex}`;

	let response = await httpFetch(url);
}

function httpFetch(url, notParse) {
	return new Promise((resolve, reject) => {
		let xhr=new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if (this.readyState!=4) return;
			if (this.status >= 200 && this.status < 300) {
				let result = this.responseText;
				if(!notParse) {
					result = JSON.parse(result);
				}
				resolve(result);
			} else {
				reject(this.statusText);
			}
		}
		xhr.open('GET', url, true);
		xhr.send();
	});
}
