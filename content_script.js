// content_script.js - ULTRA 2.0 (MAX AGGRESSION)

function aggressiveBlocker(mutationsList, observer) {
    
    // 1. নেভিগেশন আইকন এবং লিঙ্ক ব্লক (m. & www.)
    const distractionPaths = ['/reels/', '/watch/', '/marketplace/', '/stories/'];
    
    distractionPaths.forEach(path => {
        const links = document.querySelectorAll(`a[href*="${path}"]`);
        links.forEach(link => {
            // Updated selectors to find the parent container more reliably
            let parentToHide = link.closest('[role="tab"], li, div[role="menuitem"], div[role="feed"] > div, div[data-visualcompletion="ignore-dynamic"]');
            if (parentToHide) {
                parentToHide.style.display = 'none';
            }
        });
    });

    // 2. ফিডের মধ্যে ভিডিও এবং স্টোরি কন্টেইনার ব্লক করা (www এবং m উভয়ের জন্য)
    const feedDistractionSelectors = [
        // Reels & Watch Section Containers
        '[role="feed"] div:has(div[data-testid*="StoriesTab"]), [role="feed"] div:has(a[href*="/reels/"])',
        
        // Targetting the main HTML video tag aggressively
        'video', 
        
        // New selectors for iframes, embeds, and objects that might contain video
        'iframe, object, embed',
        
        // Stories and Video tabs/sections 
        'div[data-pagelet*="Stories"], div[data-pagelet*="Video"], a[href*="/stories/"]',
        
        // Targeting Sponsored/Suggested content that usually contains videos
        '[data-testid*="fbFeedStory"] article div:has(video)',
        '[aria-label*="Suggested Videos"]',
        '[aria-label*="Reels and short videos"]',
        // Targeting the 'Sponsored' label's parent container (highly aggressive)
        'span:not([data-visualcompletion]) > div:not([style]):has(span[dir="auto"]:not(:has(a))[style*="color"] > span:not([style])), span[dir="auto"]:not(:has(a))[style*="color"]:not(:has(span))'
    ];
    
    feedDistractionSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Find the closest full post container or the video itself
                let containerToHide = el.closest('[role="feed"] > div, [role="article"], [data-testid*="fbFeedStory"], [data-visualcompletion="ignore-dynamic"]');
                if (containerToHide && containerToHide.parentElement.children.length > 1) {
                    containerToHide.style.display = 'none';
                } else if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME' || el.tagName === 'OBJECT' || el.tagName === 'EMBED') {
                    // Hide the element if no suitable parent is found
                    el.style.display = 'none';
                }
            });
        } catch (e) {
            // Ignore complex selectors if they fail
        }
    });
}

// MutationObserver সেট আপ করা (Dynamic loading handling)
const targetNode = document.body;
const config = { childList: true, subtree: true };

const observer = new MutationObserver(aggressiveBlocker);
observer.observe(targetNode, config);

// পেজ লোডের সঙ্গে সঙ্গেই একবার চালানো
aggressiveBlocker();
