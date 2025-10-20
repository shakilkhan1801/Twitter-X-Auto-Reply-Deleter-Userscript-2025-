 /*
Twitter/X Fast Reply Deleter - Smooth Scroll Version (2025)
Deletes 1 reply → Scrolls down 1 post smoothly
No aggressive scrolling - natural flow
https://github.com/shakilkhan1801/Twitter-X-Auto-Reply-Deleter-Userscript-2025-.git
*/

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get current username from page
const getMyUsername = () => {
  const urlMatch = window.location.href.match(/x\.com\/([^\/]+)|twitter\.com\/([^\/]+)/);
  if (urlMatch) return (urlMatch[1] || urlMatch[2]).toLowerCase();
  return null;
};

// Find my tweets only
const getMyTweets = (username) => {
  const tweets = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
  return tweets.filter(tweet => {
    try {
      const usernameEl = tweet.querySelector('[data-testid="User-Name"] a[href*="/"]');
      if (!usernameEl) return false;
      const href = usernameEl.getAttribute('href').replace('/', '').toLowerCase();
      return href === username;
    } catch {
      return false;
    }
  });
};

// Smooth scroll down by one post height
const scrollOnePost = async () => {
  // Get approximate height of one post (usually 400-600px)
  const scrollAmount = 500;
  
  window.scrollBy({
    top: scrollAmount,
    behavior: 'smooth'
  });
  
  await wait(1200); // Wait for smooth scroll to complete
};

// Completely remove post from DOM
const removePost = (tweet) => {
  try {
    // Find and remove cellInnerDiv parent
    let current = tweet;
    for (let i = 0; i < 10; i++) {
      current = current.parentElement;
      if (!current || current.tagName === 'BODY') break;
      
      if (current.getAttribute('data-testid') === 'cellInnerDiv') {
        current.remove();
        return;
      }
    }
    
    // Fallback: just remove the tweet
    tweet.remove();
    
  } catch (e) {
    // Fallback: hide it
    tweet.style.display = 'none';
  }
};

// Find delete option in menu
const findDeleteOption = () => {
  const menus = document.querySelectorAll('[role="menuitem"]');
  for (let menu of menus) {
    const text = menu.textContent.toLowerCase().trim();
    if (text.includes('delete') || text.includes('মুছে')) {
      return menu;
    }
  }
  return null;
};

// Main delete function - Smooth Scroll
const deleteAllReplies = async () => {
  console.log('🚀 Smooth Scroll Reply Deleter Started!');
  
  const MY_USERNAME = getMyUsername();
  if (!MY_USERNAME) {
    console.error('❌ Could not detect username from URL');
    return;
  }
  
  console.log(`✅ Targeting: @${MY_USERNAME}`);
  console.log('⚡ Delete 1 → Scroll 1 post (smooth)\n');
  
  let totalDeleted = 0;
  let attempts = 0;
  let consecutiveNoDelete = 0;
  const maxAttempts = 2850;
  const maxNoDelete = 20;
  
  while (attempts < maxAttempts && consecutiveNoDelete < maxNoDelete) {
    attempts++;
    
    try {
      // Get visible tweets
      let myTweets = getMyTweets(MY_USERNAME);
      
      if (myTweets.length === 0) {
        consecutiveNoDelete++;
        console.log(`⚠️ No tweets visible (${consecutiveNoDelete}/${maxNoDelete})`);
        
        // Scroll down to load more
        await scrollOnePost();
        continue;
      }
      
      if (attempts % 10 === 0) {
        console.log(`🎯 Found ${myTweets.length} tweets visible`);
      }
      
      // Take first visible tweet
      const tweet = myTweets[0];
      
      try {
        const moreButton = tweet.querySelector('[data-testid="caret"]');
        if (!moreButton || moreButton.offsetParent === null) {
          console.log('⚠️ No menu button, removing tweet');
          removePost(tweet);
          await wait(600);
          
          // Scroll down after removing
          await scrollOnePost();
          continue;
        }
        
        // Click more menu
        moreButton.click();
        await wait(600);
        
        // Find delete option
        const deleteOption = findDeleteOption();
        if (!deleteOption) {
          console.log('⚠️ No delete option, removing tweet');
          document.body.click();
          await wait(200);
          removePost(tweet);
          consecutiveNoDelete++;
          
          // Scroll down after removing
          await scrollOnePost();
          continue;
        }
        
        // Click delete
        deleteOption.click();
        await wait(600);
        
        // Find and click confirm
        let confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        
        if (!confirmBtn) {
          const buttons = document.querySelectorAll('button, div[role="button"]');
          for (let btn of buttons) {
            const text = btn.textContent.toLowerCase();
            if ((text.includes('delete') || text.includes('মুছে')) && btn.offsetParent !== null) {
              confirmBtn = btn;
              break;
            }
          }
        }
        
        if (confirmBtn) {
          confirmBtn.click();
          totalDeleted++;
          consecutiveNoDelete = 0;
          console.log(`✅ Deleted reply #${totalDeleted}`);
          await wait(1000);
          
          // Remove the post completely
          removePost(tweet);
          
          // SMOOTH SCROLL DOWN BY 1 POST
          await scrollOnePost();
          
        } else {
          console.log('⚠️ Confirm not found, removing tweet');
          document.body.click();
          removePost(tweet);
          
          // Scroll down after removing
          await scrollOnePost();
        }
        
      } catch (e) {
        console.error('Error:', e.message);
        try { 
          document.body.click();
          removePost(tweet);
          await scrollOnePost();
        } catch {}
        await wait(600);
      }
      
      // Quick delay
      const delay = 800 + Math.random() * 600;
      await wait(delay);
      
      // Progress
      if (totalDeleted > 0 && totalDeleted % 5 === 0) {
        console.log(`⚡ Progress: ${totalDeleted} deleted`);
      }
      
      // Hide sidebar
      document.querySelectorAll('[data-testid="sidebarColumn"] > div').forEach(div => {
        div.style.display = 'none';
      });
      
    } catch (error) {
      console.error(`Error at attempt #${attempts}:`, error.message);
      await wait(2000);
    }
  }
  
  console.log(`\n🎉 DONE!`);
  console.log(`✅ Total deleted: ${totalDeleted}`);
  console.log(`🔄 Total attempts: ${attempts}`);
  
  const remaining = getMyTweets(MY_USERNAME);
  if (remaining.length > 0) {
    console.log(`\n⚠️ Still ${remaining.length} tweets visible`);
    console.log(`💡 Scroll up and run again, or manually check`);
  } else {
    console.log(`\n✨ No more replies found!`);
  }
};

// Start after 2 seconds
setTimeout(() => {
  deleteAllReplies().catch(e => console.error('Fatal error:', e));
}, 4000);
