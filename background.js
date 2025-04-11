// https://meta.stackexchange.com/help/badges/39/enthusiast
// https://meta.stackexchange.com/help/badges/53/fanatic

const closeTabDelay = 1000; // leave the site open briefly, just to cut down on the spookiness factor
const url = 'https://stackoverflow.com/users/9412456/stelio-kontos';

const closeTabDelay = 2000; // leave the site open briefly, just to cut down on the spookiness factor

function getUTCDateString(date = new Date()) {
	return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url === url && changeInfo.status === 'complete') {
		const todayUTC = getUTCDateString();
		chrome.storage.local.set({ lastVisitDate: todayUTC });
		console.log(`Visited ${url} on ${todayUTC}`);
	}
});

chrome.alarms.create('checkLastVisitDate', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'checkLastVisitDate') {
		const todayUTC = getUTCDateString();
		chrome.storage.local.get('lastVisitDate', (data) => {
			if (!data.lastVisitDate || todayUTC > data.lastVisitDate) {
				console.log(`No logged visit today for ${url} (last visit was ${data.lastVisitDate}).`);
				loadSiteProc();
			}
		});
	}
});

function loadSiteProc() {
	chrome.tabs.create({ url: url, active: false }, (newTab) => {
		console.log(`Visiting ${url} on ${getUTCDateString()}`);
		chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
			if (tabId === newTab.id && changeInfo.status === 'complete') {
				chrome.tabs.onUpdated.removeListener(listener);
				setTimeout(() => { chrome.tabs.remove(newTab.id); }, closeTabDelay);
			}
		});
	});
}

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'update') { upgradeCleanup(); }
});

function upgradeCleanup() {
	const ver = chrome.runtime.getManifest().version;
	console.log(`Upgrading to ${ver}`);
	if (ver.startsWith('1.1')) {
		chrome.alarms.clear('checkTime');             // removed v1.1.0
		chrome.storage.local.remove('lastLoadTime');  // removed v1.1.0
		console.log(`Cleaned up v1.0.x data.`);
	}
}
