(async () => {
    const form = <HTMLFormElement>document.querySelector('[id="getMyFingerprint"]');

    if (form) {
        form.onsubmit = async (e: SubmitEvent | any) => {
            e.preventDefault();

            const { submitter } = e;

            if (submitter) {
                const tabs = await chrome.tabs.query({
                    currentWindow: true,
                    url: [
                        "*://onlyfans.com/*",
                    ]
                });

                const tab = tabs.pop();

                if (tab) {
                    const { id: tabId } = tab;

                    const executed = await chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: true },
                        world: "MAIN",
                        func: () => {
                            const app: any = document.querySelector('[id="app"]');

                            if (app) {
                                const { __vue__: vue } = app;

                                const { isAuth } = vue;

                                const { userAgent } = navigator;

                                const bcTokenSha = localStorage.getItem('bcTokenSha');
                                const userId = localStorage.getItem('user');

                                return {
                                    isAuth,
                                    userAgent,
                                    bcTokenSha,
                                    userId
                                };
                            }
                        },
                    });

                    const { result } = executed[0];

                    const { isAuth } = result;

                    if (isAuth) {
                        const cookies = await chrome.cookies.getAll({
                            url: 'https://onlyfans.com'
                        });

                        const fingerprint = {
                            cookies,
                            ...result,
                        };

                        submitter.textContent = 'Fingerprint collected';

                        submitter.disabled = true;
                    } else {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId, allFrames: true },
                            world: "MAIN",
                            func: () => {
                                const app: any = document.querySelector('[id="app"]');

                                if (app) {
                                    const { __vue__: vue } = app;

                                    const { showToast } = vue;

                                    showToast({ text: 'Login before getting fingerprint' });

                                    return true;
                                }
                            },
                        });

                        submitter.textContent = 'Login before getting fingerprint';
                    }
                } else {
                    chrome.tabs.create({
                        active: true,
                        url: 'https://onlyfans.com'
                    });

                    submitter.textContent = 'Login before getting fingerprint';
                }
            }

            return true;
        };
    }
})();