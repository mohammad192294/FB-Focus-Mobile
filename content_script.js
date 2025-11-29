// content_script.js

function blockFacebookDistractions() {
    // 1. যে URL পথ বা Link Address গুলো আমরা ব্লক করতে চাই (Reels, Watch, Marketplace)
    const distractionPaths = [
        '/reels/',
        '/watch/',
        '/marketplace/'
    ];

    // 2. পেজের সব Link (<a> tags) সিলেক্ট করা
    const allLinks = document.querySelectorAll('a');

    allLinks.forEach(link => {
        const linkHref = link.href || ''; 
        
        // 3. লিংকটি ব্লক করার পথের মধ্যে পড়ে কিনা তা যাচাই করা
        const isDistractionLink = distractionPaths.some(path => linkHref.includes(path));

        if (isDistractionLink) {
            // 4. পুরো আইকন বা ট্যাব-টিকে লুকিয়ে ফেলার জন্য তার মূল কন্টেইনারটিকে খুঁজে বের করা
            // এটি সাধারণত নেভিগেশন বারে 'div[role="tab"]' বা 'li' ট্যাগের মধ্যে থাকে।
            let parentToHide = link.closest('div[role="tab"], li, div[role="menuitem"]');
            
            if (parentToHide) {
                // কন্টেইনারটি পেলে সেটিকে লুকিয়ে দেওয়া
                parentToHide.style.display = 'none';
            } else {
                // যদি কন্টেইনার খুঁজে না পায়, তবে শুধু লিঙ্কটি লুকিয়ে দেওয়া
                link.style.display = 'none';
            }
        }
    });
}

// কোডটি পেজ লোড হওয়ার সাথে সাথেই চালানো
blockFacebookDistractions();

// প্রতি 200 মিলিসেকেন্ড পর পর কোডটি পুনরায় চালানো (Dynamic Loading)
// ফেসবুক যেহেতু স্ক্রল করার সাথে সাথে নতুন কন্টেন্ট লোড করে, তাই বার বার এটি চালানো গুরুত্বপূর্ণ।
setInterval(blockFacebookDistractions, 200);
