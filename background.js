// https://meta.stackexchange.com/help/badges/39/enthusiast
// https://meta.stackexchange.com/help/badges/53/fanatic

const url = 'https://stackoverflow.com/users/9412456/stelio-kontos';
const hr = 23, min = 0;
// const hr = 0, min = 1; // for testing

const timeoutPeriod = ((hr * 60 + min) * 60) * 1000;
const closeTabDelay = 2000; // leave the site open briefly, just to cut down on the spookiness factor

chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.set({ lastLoadTime: Date.now() });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url === url && changeInfo.status === 'complete') {
		chrome.storage.local.set({ lastLoadTime: Date.now() });
	}
});

chrome.alarms.create('checkTime', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'checkTime') {
		chrome.storage.local.get('lastLoadTime', (data) => {
			if (Date.now() - data.lastLoadTime >= timeoutPeriod) { loadSiteProc(); }
		});
	}
});

function loadSiteProc() {
	chrome.tabs.create({ url: url, active: false }, (newTab) => {
		chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
			if (tabId === newTab.id && info.status === 'complete') {
				chrome.tabs.onUpdated.removeListener(listener);
				setTimeout(() => { chrome.tabs.remove(newTab.id); }, closeTabDelay);
			}
		});
	});
}
