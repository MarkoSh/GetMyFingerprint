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

    async function setupUserAgentRules(domains: string[], newUA: string) {
        // Генерируем правило для каждого домена
        const rules: any[] = domains.map((domain, index) => ({
            id: index + 1, // ID начинается с 1
            priority: 1,
            action: {
                type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                requestHeaders: [
                    {
                        header: 'user-agent',
                        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                        value: newUA
                    },
                    {
                        header: 'sec-ch-ua-mobile',
                        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                        value: '?1'
                    },
                    {
                        header: 'sec-ch-ua-platform',
                        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                        value: '"Android"'
                    }
                ]
            },
            condition: {
                urlFilter: `*://${domain}/*`,
                resourceTypes: [
                    chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                    chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                    chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                    chrome.declarativeNetRequest.ResourceType.WEBSOCKET,
                    chrome.declarativeNetRequest.ResourceType.SCRIPT,
                    chrome.declarativeNetRequest.ResourceType.STYLESHEET,
                    chrome.declarativeNetRequest.ResourceType.IMAGE,
                    chrome.declarativeNetRequest.ResourceType.MEDIA,
                    chrome.declarativeNetRequest.ResourceType.OTHER
                ]
            }
        }));

        // Собираем ID для удаления старых правил
        const removeIds = rules.map(r => r.id);

        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: removeIds,
            addRules: rules
        });

        console.log(`✅ Rules updated for ${domains.length} domains`);
    }

    const samsungUA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

    const urlFilters = [
        // 'fidsty.com',
        // '*.fidsty.com',
        'onlyfans.com',
        '*.onlyfans.com',
    ];

    setupUserAgentRules(urlFilters, samsungUA);

    async function registerMobileImplant() {
        const scriptCode = (UA: string) => {
            // 1. Обычный Navigator
            const overwrite = {
                userAgent: UA,
                appVersion: UA.replace("Mozilla/", ""),
                platform: "Linux armv8l",
                maxTouchPoints: 5,
                vendor: "Google Inc.",
                deviceMemory: 8
            };

            for (const key in overwrite) {
                try {
                    Object.defineProperty(navigator, key, {
                        get: () => overwrite[key],
                        configurable: true
                    });
                } catch (e) { }
            }

            // 2. Современные Client Hints (обязательно для Chrome 137)
            if ((navigator as any).userAgentData) {
                const brands = [
                    { brand: 'Not(A:Brand', version: '99' },
                    { brand: 'Google Chrome', version: '137' },
                    { brand: 'Chromium', version: '137' }
                ];

                Object.defineProperty(navigator, 'userAgentData', {
                    get: () => ({
                        brands: brands,
                        mobile: true,
                        platform: 'Android',
                        getHighEntropyValues: (hints) => Promise.resolve({
                            architecture: "",
                            model: "K",
                            platform: "Android",
                            platformVersion: "10.0.0",
                            uaFullVersion: "137.0.0.0"
                        })
                    }),
                    configurable: true
                });
            }

            // 3. Подмена Screen (чтобы верстка была мобильной)
            const screenProps = {
                width: 360,
                height: 800,
                availWidth: 360,
                availHeight: 800,
                colorDepth: 24,
                pixelDepth: 24
            };

            for (const key in screenProps) {
                try {
                    // Object.defineProperty(window.screen, key, { 
                    //    get: () => screenProps[key], 
                    //    configurable: true 
                    // });
                } catch (e) { }
            }

            // Принуждаем мобильный Viewport
            // window.innerWidth = 360;
            // window.innerHeight = 800;

            console.log("🚀 [Implant] Chrome 137 Android Mode Active");
        };

        try {
            await chrome.userScripts.unregister({ ids: ['mobile-implant'] }).catch(() => { });

            await chrome.userScripts.register([{
                id: 'mobile-implant',
                matches: urlFilters.map((urlFilter: string) => `*://${urlFilter}/*`),
                js: [{ code: `(${scriptCode})('${samsungUA}')` }],
                runAt: 'document_start',
                world: 'MAIN'
            }]);

            console.log("✅ UserScript Registered: Android 10 Mode");
        } catch (err) {
            console.error("❌ Registration failed:", err);
        }
    }

    // Запуск при старте
    chrome.runtime.onInstalled.addListener(registerMobileImplant);
    chrome.runtime.onStartup.addListener(registerMobileImplant);
})();