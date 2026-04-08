(async () => {
    console.log(`[GETMYFINGERPRINT]: background`);

    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error(error));
})();