// Clean Paste's clean() on typical pastes, run inside a page (it needs the browser's DOMParser) by browser-check.mjs in
// each browser it starts. Each case names what must hold: the HTML out, the plain text, which checks fire, a count.
// A failure means the cleaner changed what it does with that paste: fix the cleaner, or the case if the change is wanted.
const WORD = (body) => `<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><!--StartFragment-->${body}<!--EndFragment--></body></html>`;

const CASES = [
  { name: 'Word bullets become a real list, bold and italic kept, o:p dropped',
    in: { html: WORD('<p class=MsoListParagraphCxSpFirst style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">·<span>&nbsp;&nbsp;</span></span>First</p><p class=MsoListParagraphCxSpLast style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">·</span>Second</p><p class=MsoNormal><b>Bold</b> and <i>italic</i><o:p></o:p></p>') },
    source: 'Word', html: '<ul>\n  <li>First</li>\n  <li>Second</li>\n</ul>\n<p><strong>Bold</strong> and <em>italic</em></p>', text: '• First\n• Second\n\nBold and italic', checks: [] },
  { name: 'Google Docs: bold and italic from styles, the wrapper gone, a redirect link unwrapped',
    in: { html: '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-abc"><p dir="ltr"><span style="font-weight:700;">Strong</span><span style="font-weight:400;"> and </span><span style="font-style:italic;">em</span></p><p dir="ltr"><a href="https://www.google.com/url?q=https://example.com/page&amp;sa=D&amp;ust=1"><span>a link</span></a></p></b>' },
    source: 'Google Docs', html: '<p><strong>Strong</strong> and <em>em</em></p>\n<p><a href="https://example.com/page">a link</a></p>', stats: { googleLinks: 1 }, checks: ['ok'] },
  { name: 'Scripts, styles, hidden text and empty paragraphs are dropped',
    in: { html: '<style>p{color:red}</style><script>alert(1)</script><p>Kept</p><p>&nbsp;</p><p></p><div><span style="display:none">hidden</span>Visible</div>' },
    source: 'Web page', html: '<p>Kept</p>\n<p>Visible</p>', checks: [] },
  { name: 'Plain text: each line is a paragraph, blank lines skipped',
    in: { text: 'Line one\n\nLine two' }, source: 'Plain text', html: '<p>Line one</p>\n<p>Line two</p>', checks: [] },
  { name: 'HTML code pasted as text is read as HTML',
    in: { text: '<h2>Title</h2><p>Body</p>' }, source: 'HTML code', html: '<h2>Title</h2>\n<p>Body</p>', checks: [] },
  { name: 'Checks: an H1, a bold-only line, a draft link, a Word bookmark and "click here"',
    in: { html: '<h1>Page title</h1><p><b>Looks like a heading</b></p><p>Read the <a href="https://docs.google.com/document/d/x">draft</a> or <a href="https://example.com">click here</a> and <a href="#_Toc123">a bookmark</a>.</p>' },
    checks: ['warn h1', 'warn bold', 'warn private', 'warn bookmark', 'warn vague'] },
  { name: 'One Word comment, with its marker and the comment list, counts as one',
    in: { html: WORD('<p class=MsoNormal>Text<span class=MsoCommentReference><a class=msocomanchor href="#_msocom_1">[JS1]</a></span></p><div style="mso-element:comment-list"><hr class=msocomoff><div style="mso-element:comment"><p class=MsoCommentText>A note</p></div></div>') },
    html: '<p>Text</p>', stats: { comments: 1 }, checkText: 'Removed 1 Word comment.' },
  { name: 'Two Word comment markers without the list count as two',
    in: { html: WORD('<p class=MsoNormal>One<span class=MsoCommentReference>[JS1]</span> and two<span class=MsoCommentReference>[JS2]</span></p>') },
    html: '<p>One and two</p>', stats: { comments: 2 } },
  { name: 'WordPress blocks: a heading and a list in block markup',
    in: { html: '<h2>Title</h2><ul><li>One</li></ul>' },
    wp: ['<!-- wp:heading -->\n<h2 class="wp-block-heading">Title</h2>\n<!-- /wp:heading -->', '<!-- wp:list -->\n<ul class="wp-block-list"><!-- wp:list-item -->\n<li>One</li>'] },
];

export async function cleanPasteCases(page) {
  const results = await page.evaluate(async (cases) => {
    const m = await import('/formatter/js/clean.js');
    return cases.map((c) => {
      const r = m.clean(c.in);
      return { source: m.detectSource(c.in.html || '', c.in.text || ''), html: r.html, text: r.text, stats: r.stats, wp: m.wpBlocks(r.root),
        checks: r.checks.map((k) => `${k.level}${k.id ? ' ' + k.id : ''}`), checkTexts: r.checks.map((k) => k.text) };
    });
  }, CASES.map((c) => ({ in: c.in })));
  const problems = [];
  CASES.forEach((c, i) => {
    const r = results[i], bad = (what, got) => problems.push(`${c.name}: ${what} (got ${JSON.stringify(got)})`);
    if (c.source && r.source !== c.source) bad(`source should be ${c.source}`, r.source);
    if (c.html !== undefined && r.html !== c.html) bad('HTML differs', r.html);
    if (c.text !== undefined && r.text !== c.text) bad('text differs', r.text);
    if (c.checks && JSON.stringify(r.checks) !== JSON.stringify(c.checks)) bad(`checks should be ${JSON.stringify(c.checks)}`, r.checks);
    if (c.checkText && !r.checkTexts.includes(c.checkText)) bad(`should say "${c.checkText}"`, r.checkTexts);
    for (const [k, v] of Object.entries(c.stats || {})) if (r.stats[k] !== v) bad(`${k} should be ${v}`, r.stats[k]);
    for (const w of c.wp || []) if (!r.wp.includes(w)) bad('WordPress blocks missing a part', r.wp.slice(0, 200));
  });
  return { count: CASES.length, problems };
}
