// Basic icons
const MUTE_ICON_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>
</svg>
`;

// Helper to create the button
function createMuteButton() {
    const btn = document.createElement('div');
    btn.className = 'x-one-click-mute-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Mute User');
    btn.setAttribute('title', 'Mute User (One Click)');
    btn.innerHTML = MUTE_ICON_SVG;
    return btn;
}

// Function to handle the actual mute logic
async function handleMuteClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const tweetArticle = button.closest('article[data-testid="tweet"]');

    if (!tweetArticle) {
        console.error('X-Mute: Could not find parent tweet article');
        return;
    }

    // 1. Find the "More" (caret) button. 
    const moreBtn = tweetArticle.querySelector('[data-testid="caret"]');
    if (!moreBtn) {
        console.error('X-Mute: Could not find More button');
        return;
    }

    // 2. Click it to open menu
    moreBtn.click();

    // 3. Wait for the Dropdown menu to appear and find the item
    // Retrying a few times in case of render delay
    let attempts = 0;
    const maxAttempts = 10;

    const findAndClickMute = () => {
        const dropdowns = document.querySelectorAll('[data-testid="Dropdown"]');
        const menu = dropdowns[dropdowns.length - 1];

        if (!menu && attempts < maxAttempts) {
            attempts++;
            setTimeout(findAndClickMute, 50); // Retry every 50ms
            return;
        }

        if (!menu) {
            console.error('X-Mute: Menu did not appear');
            return;
        }

        // 4. Find the Mute item. 
        // Text can be "Mute @user" (English) or "@userさんをミュート" (Japanese) or just "ミュート"
        const items = menu.querySelectorAll('[role="menuitem"]');
        let muteItem = null;

        console.log(`X-Mute: Checking ${items.length} menu items...`);

        for (const item of items) {
            const text = item.textContent || item.innerText;
            const testId = item.getAttribute('data-testid');

            // Log for debugging (temporary)
            console.log(`Item: "${text}", testid: "${testId}"`);

            // Check for English "Mute" and Japanese "ミュート"
            // Also check data-testid just in case
            if (text.includes('Mute') || text.includes('ミュート') || (testId && testId.toLowerCase().includes('mute'))) {
                muteItem = item;
                break;
            }
        }

        if (muteItem) {
            console.log('X-Mute: Found mute item, clicking...', muteItem.textContent);
            muteItem.click();
            // Optionally close menu if it doesn't close automatically? 
            // Usually clicking an item closes it.
        } else {
            console.warn('X-Mute: Mute option not found in menu. Items found:', items.length);
            // Try to close menu to clean up if we failed
            moreBtn.click();
        }
    };

    // Start looking
    setTimeout(findAndClickMute, 50);
}

// Main observer to inject buttons
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the node itself is a tweet or contains tweets
                const tweets = node.querySelectorAll ? node.querySelectorAll('article[data-testid="tweet"]') : [];

                // Also check the node itself
                if (node.matches && node.matches('article[data-testid="tweet"]')) {
                    injectButton(node);
                }

                tweets.forEach(injectButton);
            }
        }
    }
});

function injectButton(tweetNode) {
    if (tweetNode.dataset.xMuteBtnInjected) return;

    // Locate the action bar (Reply, Retweet, Like, Share group)
    // usually has role="group" and is at the bottom of the tweet
    const roleGroups = tweetNode.querySelectorAll('div[role="group"]');
    const actionBar = roleGroups[roleGroups.length - 1]; // usually the last one

    if (actionBar) {
        const muteBtn = createMuteButton();
        muteBtn.addEventListener('click', handleMuteClick);

        // Append it to the action bar
        // We might want to be careful about layout. The action bar is usually flex.
        // Appending it works, but verifying visual alignment is needed.
        actionBar.appendChild(muteBtn);
        tweetNode.dataset.xMuteBtnInjected = 'true';
    }
}

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial pass for existing tweets
document.querySelectorAll('article[data-testid="tweet"]').forEach(injectButton);
