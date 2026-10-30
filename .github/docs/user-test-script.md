# User test: Clean Paste and the Image Resizer

About 15 minutes per person. Three people outside the team, ideally one writer or editor, one person
who posts on a CMS (a small business owner or marketer) and one who rarely does either. Their own
computer if possible; a phone for the last part if they have one.

## Before you start

- Send nothing in advance. Open https://jsal.io/ on their computer, or share your screen and let them drive.
- Have the files from `test-files/` (next to this script) in a folder they can reach:
  - `messy-word-post.html`: a short blog post as Word puts it on the clipboard. Open it in their browser,
    then select all and copy it, or use a Word or Google Docs file of their own.
  - five images: a large landscape photo, a portrait photo, a square product shot, a small PNG logo with a
    transparent background, and a tiny thumbnail (smaller than the output size, so it gets upscaled).
  - an iPhone photo (HEIC), if they have an iPhone. It can't be made here.
- Say: "I'm testing the tools, not you. Think out loud, and there are no wrong answers. I won't help
  unless you're stuck for a while."
- Don't explain what anything does. Note the time each task takes.

## Task 1: Clean Paste (6 minutes)

**Say:** "You've written a blog post in Word and need to put it on a WordPress site. Get it ready using
this page." Open https://jsal.io/formatter/ and give them the copied sample (or their own document).

**Watch for**
- How they paste: keyboard, right-click, or looking for a button. Any hesitation before the first paste.
- Whether they notice the Checks list, and whether they click **Show** on one. Do they see which line it
  means, and do they fix it (for example, turn the bold line into a heading)?
- Which copy button they choose for WordPress, and whether they're sure it's the right one.
- Anything they read aloud and get wrong: "HTML", "WordPress blocks", "formatted text".
- Wrong clicks, scrolling around looking for something, or giving up.

**Ask afterwards**
1. "What did this page do to your text, in your own words?"
2. "Was there anything you expected it to do that it didn't, or anything that surprised you?"
3. "Which of the checks would you actually fix before publishing, and which would you ignore?"

## Task 2: Image Resizer (6 minutes)

**Say:** "You're writing a blog post and need these five images at 1200 × 628 for it. Get them ready to
upload." Open https://jsal.io/image-resizer/ and point them to the images folder.

**Watch for**
- How they add the images: dragging, clicking the drop area, or looking for a button.
- Whether they notice the crop, and try to move it on the portrait photo (the subject is near the top).
- Whether they notice the "Upscaled" warning on the tiny thumbnail, and what they think it means.
- Whether they change Quality, Format or Save to, and why. Which format they'd pick for their CMS.
- How they download: one by one, Download All, ZIP. Whether they find the files afterwards.
- The transparent PNG saved as JPG gets a white background. Do they mind, or notice?

**Ask afterwards**
1. "If you did this every week, what would you want to be faster or different?"
2. "What did you think the 1200 × 628 and 640 × 420 options were for?"
3. "Would you trust this with client or unreleased images? Why, or why not?"

## Task 3: On a phone (3 minutes, if they have one)

**Say:** "Now try pasting a paragraph into Clean Paste on your phone." Then: "And resize one photo
from your camera roll."

**Watch for**
- Whether they find a way to paste: the **Paste from clipboard** button, or tapping and holding.
- Whether the resizer opens their photo (an iPhone HEIC photo is the real test) and saves it where they
  can find it.

## After the session

- Write down, per task: time taken, where they hesitated, what they misread, and the quotes that stood out.
- Anything two of the three people trip on is worth fixing first.
- Send ideas or problems to dev@jsal.io (the same address as the tools' "Email me" link).
