// Basic icons
const MUTE_ICON_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M18 6.59V6c0-3.31-2.69-6-6-6S6 2.69 6 6v.59L2.5 12V21h19v-9L18 6.59zM8 6c0-2.21 1.79-4 4-4s4 1.79 4 4v.59l-8 ?8V6zm11.5 13H4.5v-6.41l2.45-2.45h10.1l2.45 2.45V19z"></path>
    <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>
</svg>
`;

const NOT_INTERESTED_ICON_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9.5 7c.828 0 1.5 1.119 1.5 2.5S10.328 12 9.5 12 8 10.881 8 9.5 8.672 7 9.5 7zm5 0c.828 0 1.5 1.119 1.5 2.5s-.672 2.5-1.5 2.5S13 10.881 13 9.5 13.672 7 14.5 7zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-5-5h10v2H7v-2z"></path>
</svg>
`;

// Helper to create the button
function createActionButton(iconSvg, title, ariaLabel, validTitles, baseColor) {
    const btn = document.createElement('div');
    btn.className = 'x-one-click-action-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', ariaLabel);
    btn.setAttribute('title', title);
    btn.innerHTML = iconSvg;

    // validTitles is an array of strings to look for in the menu
    // e.g. ['Mute', 'ミュート'] or ['Beğenmiyor', 'Not interested in this post', 'このポストに興味がない']
    btn.dataset.validTitles = JSON.stringify(validTitles);

    // Visual styling helper within the button if needed, but styling is mostly CSS
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '32px'; // Adjust as needed to match X's buttons
    btn.style.height = '32px';
    btn.style.cursor = 'pointer';
    btn.style.marginLeft = '4px';
    btn.style.color = baseColor; // Use the passed base color
    btn.style.transition = 'background-color 0.2s';
    btn.style.borderRadius = '9999px';

    btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        btn.style.color = 'rgb(29, 155, 240)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = baseColor;
    });

    return btn;
}

// Generic function to handle menu actions
async function handleActionClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const tweetArticle = button.closest('article[data-testid="tweet"]');
    const validTitles = JSON.parse(button.dataset.validTitles || '[]');

    if (!tweetArticle) {
        console.error('X-OneClick: Could not find parent tweet article');
        return;
    }

    // 1. Find the "More" (caret) button. 
    const moreBtn = tweetArticle.querySelector('[data-testid="caret"]');
    if (!moreBtn) {
        console.error('X-OneClick: Could not find More button');
        return;
    }

    // 2. Click it to open menu
    moreBtn.click();

    // 3. Wait for the Dropdown menu to appear and find the item
    let attempts = 0;
    const maxAttempts = 15; // increased attempts

    const findAndClickItem = () => {
        const dropdowns = document.querySelectorAll('[data-testid="Dropdown"]');
        const menu = dropdowns[dropdowns.length - 1];

        if (!menu && attempts < maxAttempts) {
            attempts++;
            setTimeout(findAndClickItem, 50); // Retry every 50ms
            return;
        }

        if (!menu) {
            console.error('X-OneClick: Menu did not appear');
            return;
        }

        // 4. Find the target item. 
        const items = menu.querySelectorAll('[role="menuitem"]');
        let targetItem = null;

        console.log(`X-OneClick: Checking ${items.length} menu items for`, validTitles);

        for (const item of items) {
            const text = item.textContent || item.innerText;
            const testId = item.getAttribute('data-testid') || '';

            // Debug log
            // console.log(`Item: "${text}", testid: "${testId}"`);

            // Check if text matches any of our valid titles
            const textMatch = validTitles.some(t => text.includes(t));
            const testIdMatch = validTitles.some(t => testId.toLowerCase().includes(t.toLowerCase())); // loose check for testid

            if (textMatch || testIdMatch) {
                targetItem = item;
                break;
            }
        }

        if (targetItem) {
            console.log('X-OneClick: Found item, clicking...', targetItem.textContent);
            targetItem.click();
        } else {
            console.warn('X-OneClick: Option not found in menu.', validTitles);
            // Close menu to clean up
            moreBtn.click();
        }
    };

    // Start looking
    setTimeout(findAndClickItem, 50);
}

// Main observer to inject buttons
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tweets = node.querySelectorAll ? node.querySelectorAll('article[data-testid="tweet"]') : [];
                if (node.matches && node.matches('article[data-testid="tweet"]')) {
                    injectButtons(node);
                }
                tweets.forEach(injectButtons);
            }
        }
    }
});

function injectButtons(tweetNode) {
    if (tweetNode.dataset.xOneClickInjected) return;

    const roleGroups = tweetNode.querySelectorAll('div[role="group"]');
    const actionBar = roleGroups[roleGroups.length - 1];

    if (actionBar) {
        // Determine the color from standard buttons (reply, retweet, etc.)
        // We try to find the "Reply" button which usually has data-testid="reply"
        let baseColor = 'rgb(83, 100, 113)'; // fallback light mode color
        const refBtn = actionBar.querySelector('[data-testid="reply"]') || actionBar.querySelector('[data-testid="like"]');

        if (refBtn) {
            // The color is usually computed on the svg or the inner div
            const style = window.getComputedStyle(refBtn);
            // If the button itself has the color
            if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
                baseColor = style.color;
            } else {
                // Sometimes the color is on the SVG inside
                const svg = refBtn.querySelector('svg');
                if (svg) {
                    baseColor = window.getComputedStyle(svg).color;
                }
            }
        }

        // Create Mute Button
        const muteBtn = createActionButton(
            MUTE_ICON_SVG,
            'Mute User (One Click)',
            'Mute User',
            ['Mute', 'ミュート'],
            baseColor
        );
        muteBtn.addEventListener('click', handleActionClick);

        // Create Not Interested Button
        // Japanese: "このポストに興味がない"
        // English: "Not interested in this post"
        const notInterestedBtn = createActionButton(
            NOT_INTERESTED_ICON_SVG,
            'Not interested in this post (One Click)',
            'Not Interested',
            ['Not interested in this post', 'このポストに興味がない'],
            baseColor
        );
        notInterestedBtn.addEventListener('click', handleActionClick);

        // Container to hold our buttons (optional, for better spacing)
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.marginLeft = '4px'; // Spacing from other icons

        container.appendChild(muteBtn);
        container.appendChild(notInterestedBtn);

        actionBar.appendChild(container); // or append btns directly

        tweetNode.dataset.xOneClickInjected = 'true';
    }
}

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial pass
document.querySelectorAll('article[data-testid="tweet"]').forEach(injectButtons);
