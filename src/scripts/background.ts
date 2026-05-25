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
                target: { tabId: tabId },
                func: () => {
                    document.title = 'Extension working';

                    const config = { attributes: true, childList: true, subtree: true };

                    const observer = new MutationObserver(() => {
                        const btn: HTMLButtonElement | null = document.querySelector('[aria-label="Filter by models"]');

                        if (btn) {
                            const originalOnclick = btn.onclick;

                            btn.onclick = (e: PointerEvent) => {
                                chrome.runtime.sendMessage('sidePanel.open');
                            };

                            observer.disconnect();
                        }
                    });

                    observer.observe(document, config);
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

    chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: Function) => {
        const { tab } = sender;

        const { id: tabId } = tab;
        if ('sidePanel.open' == message) {
            chrome.sidePanel.open({
                tabId
            });
        }
    });
})();