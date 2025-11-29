// content_script.js - ULTRA AGGRESSIVE MODE

// এই ফাংশনটি Facebook-এর DOM (HTML Structure) পরিবর্তন হওয়া দেখবে এবং ব্লক করবে।
function aggressiveBlocker(mutationsList, observer) {
    
    // 1. নেভিগেশন আইকন এবং লিঙ্ক ব্লক (Reels, Watch, Stories, Marketplace)
    const distractionPaths = ['/reels/', '/watch/', '/marketplace/', '/stories/'];
    
    distractionPaths.forEach(path => {
        const links = document.querySelectorAll(`a[href*="${path}"]`);
        links.forEach(link => {
            // আইকনের কন্টেইনার (div, li) খুঁজে লুকিয়ে দেওয়া
            let parentToHide = link.closest('[role="tab"], li, div[role="menuitem"], div[role="feed"] > div');
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
        
        // Stories and Video tabs/sections (based on data attributes)
        'div[data-pagelet*="Stories"], div[data-pagelet*="Video"], a[href*="/stories/"]',
        
        // General containers for sponsored/suggested video content
        '[data-testid*="fbFeedStory"] article div:has(video)',
        '[aria-label*="Suggested Videos"]',
        '[aria-label*="Reels and short videos"]'
    ];
    
    feedDistractionSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // ভিডিও বা স্টোরির প্যারেন্ট এলিমেন্ট খুঁজে সেটিকে সম্পূর্ণ লুকিয়ে দেওয়া 
                let containerToHide = el.closest('[role="feed"] > div, [role="article"], [data-testid*="fbFeedStory"]');
                if (containerToHide && containerToHide.parentElement.children.length > 1) {
                    containerToHide.style.display = 'none';
                } else if (el.tagName === 'VIDEO') {
                    // শুধু ভিডিও ট্যাগ পেলে সেটিকে লুকিয়ে দেওয়া
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
