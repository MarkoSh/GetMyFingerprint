(async () => {
    console.log(`[GETMYFINGERPRINT]: background`);

    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error(error));

    const initer = async () => {
        const tabs = await chrome.tabs.query({
            url: [
                "*://fidsty.com/*",
                "*://*.fidsty.com/*"
            ]
        });

        tabs.map((tab: any) => {
            const { id: tabId } = tab;
            chrome.scripting.executeScript({
                target: { tabId: tabId, allFrames: true },
                world: "MAIN",
                func: () => {
                    document.title = 'Extension working';
                },
            });
        });
    };

    chrome.management.onInstalled.addListener(initer);

    chrome.management.onEnabled.addListener(initer);

    chrome.runtime.onStartup.addListener(initer);

    chrome.runtime.onInstalled.addListener(initer);

    chrome.tabs.onActivated.addListener(initer);

    chrome.tabs.onUpdated.addListener(initer);
})();