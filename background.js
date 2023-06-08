// https://meta.stackexchange.com/help/badges/53/fanatic

const url = 'https://stackoverflow.com/users/9412456/stelio-kontos';

// const hr = 23, min = 59;
const hr = 0, min = 1;
const period = (((hr * 60 * 60) + (min * 60) + 0) * 1000) - 10; // offset by -1/100th sec to ensure the alarm fires inside the correct 1-minute interval, given the api's 1-minute periodicity

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
			if (Date.now() - data.lastLoadTime >= period) {
				loadSiteProc();
			}
		});
	}
});

function loadSiteProc() {
	chrome.windows.create({ url: url, focused: false }, (newWindow) => {
		chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
			if (tabId === newWindow.tabs[0].id && info.status === 'complete') {
				chrome.tabs.onUpdated.removeListener(listener);
				chrome.windows.remove(newWindow.id);
			}
		});
	});
}
