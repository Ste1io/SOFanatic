// https://meta.stackexchange.com/help/badges/39/enthusiast
// https://meta.stackexchange.com/help/badges/53/fanatic

let visitLock = false;
const closeTabDelay = 1000; // leave the site open briefly, just to cut down on the spookiness factor
const urls = [
	'https://stackexchange.com',
	'https://meta.stackexchange.com',
	'https://stackoverflow.com',
	'https://meta.stackoverflow.com',
	'https://gamedev.stackexchange.com',
	'https://gamedev.meta.stackexchange.com',
	'https://codereview.stackexchange.com',
	'https://codereview.meta.stackexchange.com',
	'https://reverseengineering.stackexchange.com',
	'https://reverseengineering.meta.stackexchange.com',
	'https://webmasters.stackexchange.com',
	'https://webmasters.meta.stackexchange.com',
	'https://wordpress.stackexchange.com',
	'https://wordpress.meta.stackexchange.com',
	'https://genai.stackexchange.com',
	'https://genai.meta.stackexchange.com',
	'https://crypto.stackexchange.com',
	'https://crypto.meta.stackexchange.com',
	'https://opensource.stackexchange.com',
	'https://opensource.meta.stackexchange.com',
	'https://dba.stackexchange.com',
	'https://dba.meta.stackexchange.com',
	'https://graphicdesign.stackexchange.com',
	'https://graphicdesign.meta.stackexchange.com',
	'https://superuser.com',
	'https://meta.superuser.com',
	'https://askubuntu.com',
	'https://meta.askubuntu.com',
	'https://serverfault.com',
	'https://meta.serverfault.com',
	'https://bitcoin.stackexchange.com',
	'https://bitcoin.meta.stackexchange.com',
	'https://ethereum.stackexchange.com',
	'https://ethereum.meta.stackexchange.com',
	'https://solana.stackexchange.com',
	'https://solana.meta.stackexchange.com',
];

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'update') { handleUpgradeMigration(); }
});

// Track when any URL in our list is visited
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		const baseUrl = getBaseUrl(tab.url);
		if (urls.includes(baseUrl)) {
			const todayUTC = getUTCDateString();
			updateLastVisitDate(baseUrl, todayUTC);
		}
	}
});

chrome.alarms.create('checkLastVisitDate', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'checkLastVisitDate') {
		const todayUTC = getUTCDateString();
		chrome.storage.local.get('visitDates', (data) => {
			const visitDates = data.visitDates || {};
			const urlsToVisit = urls.filter(url => !visitDates[url] || visitDates[url] < todayUTC);
			if (urlsToVisit.length > 0) {
				loadSitesSequentially(urlsToVisit);
			}
		});
	}
});

function loadSitesSequentially(urlsToVisit) {
	if (visitLock || urlsToVisit.length === 0)
		return;

	visitLock = true; // prevent re-entry while loading sites
	chrome.tabs.create({ url: urlsToVisit[0], active: false }, (newTab) => {
		const tabId = newTab.id;
		let currentIndex = 0;

		const navigateNext = () => {
			currentIndex++;
			if (currentIndex < urlsToVisit.length) {
				chrome.tabs.update(tabId, { url: urlsToVisit[currentIndex] });
			} else {
				setTimeout(() => { chrome.tabs.remove(tabId); visitLock = false; }, closeTabDelay); // release lock after closing tab
			}
		};

		chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
			if (updatedTabId === tabId && changeInfo.status === 'complete') {
				const todayUTC = getUTCDateString();
				updateLastVisitDate(urlsToVisit[currentIndex], todayUTC);
				setTimeout(navigateNext, closeTabDelay);
			}
		});
	});
}

function getUTCDateString(date = new Date()) {
	return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function getBaseUrl(fullUrl) {
	try {
		const url = new URL(fullUrl);
		return `${url.protocol}//${url.hostname}`;
	} catch (e) {
		return fullUrl;
	}
}

function updateLastVisitDate(url, date) {
	chrome.storage.local.get('visitDates', (data) => {
		const visitDates = data.visitDates || {};
		visitDates[url] = date;
		chrome.storage.local.set({ visitDates });
	});
}

function handleUpgradeMigration() {
	const ver = chrome.runtime.getManifest().version;

	if (ver.startsWith('1.2')) {
		chrome.alarms.clear('checkTime');             // removed v1.1.0
		chrome.storage.local.remove('lastVisitDate'); // removed v1.2.0

		// Migrate from old single URL format to new format
		chrome.storage.local.get('lastLoadTime', (data) => {
			if (data.lastLoadTime) {
				const visitDates = {};
				visitDates['https://stackoverflow.com'] = getUTCDateString(data.lastLoadTime);
				chrome.storage.local.set({ visitDates });
				chrome.storage.local.remove('lastLoadTime');
			}
		});
	}
}
