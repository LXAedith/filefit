# Market research: what is the biggest problem for everyday computer users?

*November 2026. Goal: pick an open-source project that is easy to build and publish on GitHub, and that people will actually use.*

## Summary

The most common problems everyday users report fall into three groups:

1. **Slowness, freezes and crashes**: the most frequent complaint, but caused by hardware and the operating system. A small app can't fix it.
2. **Clutter and searching for information**: costs 4–9 hours a week. Fixing it needs OS-level indexing, and big players (Spotlight, Windows Search, Everything) already cover it.
3. **Everyday file chores**: "file too large", "this format won't open", "I need one PDF". Demand is huge and the problem is **fully solvable inside the browser**. Today's answer (online converters) uploads people's private documents to servers, and some of those have leaked.

**Decision:** group 3. It is the easiest to solve, among the highest in demand, and the existing solutions have a serious privacy gap. The result is **FileFit**: a serverless, offline file toolbox whose privacy is enforced by the browser.

## 1. Where do users lose time?

| Finding | Source |
| --- | --- |
| People waste **up to 20 %** of their computer time on problems. The most common: the system was slow, froze, crashed, or **"it is difficult to find things"**. | University of Copenhagen and Roskilde University study ([EurekAlert](https://www.eurekalert.org/news-releases/994165), [SciTechDaily](https://scitechdaily.com/new-study-we-are-wasting-up-to-20-percent-of-our-time-on-computer-problems/)) |
| Employees spend **4.5 hours a week** looking for files, emails and links they've already seen (29 workdays a year). Windows users lose an hour more per week than Mac users. Nearly half procrastinate on tasks just because they involve cleaning up files. | Smallpdf survey of 1,005 US employees ([report](https://smallpdf.com/blog/digital-declutter-report)) |
| Searching for and gathering information takes **1.8 hours a day** (9.3 hours a week). | McKinsey Global Institute, 2012 ([overview](https://www.m-files.com/blog/articles/how-long-does-it-actually-take-to-find-a-document-dissecting-the-many-stats-out-there/)) |
| The average user toggles between apps and websites **~1,200 times a day**, which adds up to ~4 hours a week, or 9 % of working time. | Harvard Business Review, 2022: 137 users at 3 Fortune 500 companies ([summary](https://canadianunderwriter.ca/2022/08/31/how-much-time-you-waste-toggling-between-applications/)) |
| IT professionals name **user error** as the top disruption (33 %), followed by clicking suspicious links (14 %), skipping updates (12 %) and weak or forgotten passwords (11 %). | SolarWinds, 2025, 437 IT professionals ([SecurityBrief](https://securitybrief.co.uk/story/user-error-named-top-it-problem-as-survey-reveals-odd-mishaps)) |

## 2. How big are everyday file chores?

People rarely call this a "problem", but traffic and search data show the demand:

- **iLovePDF** gets ~226 million visits a month (Semrush, January 2026). **Smallpdf** reports 40+ million monthly users ([Smallpdf](https://smallpdf.com/nl/about)). pdf24.org gets ~17 million and online-convert.com ~10 million.
- **"heic to jpg"** alone is searched ~246,000 times a month, and "convert heic to jpg" ~60,500 times (Semrush, 2025). iPhone photos don't open on Windows and on many websites.
- Government and institutional forms (job, visa, university, e-government portals) almost always set a **file size limit** (100–500 KB, 1–2 MB), while phone photos are 2–5 MB.

## 3. The problem with today's solutions: privacy

- Cybernews researchers found two online PDF services (PDF Pro and Help PDF) had exposed **more than 89,000 user documents**, including passports, driver's licences, contracts and certificates ([BGR](https://bgr.com/tech/online-pdf-converters-leaked-thousands-of-user-uploaded-documents/), [it-daily](https://www.it-daily.net/en/it-security-en/data-protection-grc-en/popular-pdf-tools-expose-user-data)).
- Even "files are deleted after an hour" leaves a window of risk, and some tools were reported to keep files far beyond their stated deletion windows.
- When photos are sent by email or messaging, **EXIF data, GPS location included, travels with the file** ([Consumer Reports](https://int.wlos.com/news/consumer-reports/consumer-reports-do-your-photos-put-your-privacy-at-risk-04-25-2019)). Some social networks strip it, many channels don't ([InformationWeek](https://www.informationweek.com/it-leadership/facebook-stalking-fears-6-geotagging-facts)).

## 4. Competitors

| Product | Strength | Gap |
| --- | --- | --- |
| iLovePDF, Smallpdf, TinyPNG, online converters | Easy, well known | Upload files to servers; ads, limits, paywalls |
| [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) (~95k ⭐) | Very capable PDF tools | Needs a server/Docker; not for everyday users; no image chores |
| [BentoPDF](https://github.com/alam00000/bentopdf) (~16k ⭐) | PDF tools in the browser | PDF only; no target size, HEIC or metadata removal |
| Squoosh (Google) | High-quality single-image compression | One file at a time, no target size, no HEIC, no PDF |
| Caesium, ImageOptim | Desktop batch compression | Requires install, platform-specific |

The star counts show that **privacy-first, local tools are highly appreciated on GitHub**. Yet no project covers everyday chores (size limit + HEIC + PDF + location removal) **in one place, without installing anything**.

## 5. Scoring the problems

| Problem | How common | Solvable by a small open-source app? | Competition |
| --- | --- | --- | --- |
| Slowness, freezes | Very high | No (hardware/OS) | – |
| Finding files, clutter | High | Partly, needs OS integration | Spotlight, Everything |
| App switching, distraction | High | Hard, behavioural | Many focus apps |
| Passwords/security | High | Risky, trust is hard to earn | Bitwarden, 1Password |
| **File too big / wrong format / merging PDFs** | **Very high** | **Yes, entirely in the browser** | Online sites (privacy issue) |
| **Hidden location in photos** | Common, low awareness | **Yes** | Scattered single-purpose tools |

## 6. Product decision: FileFit

**Principles:** zero install (one link), no server, works offline, provably private.

- **Fit to size:** solves the most common pain, "get it under 200 KB", in one click. Optimises quality with a binary search and reduces resolution only when needed.
- **Convert:** HEIC → JPG first, plus every common format.
- **Make a PDF:** orders PDFs and photos into one PDF.
- **Remove hidden data:** shows GPS, camera, date and author, and removes them losslessly.
- **Trust:** a strict CSP (`connect-src 'self'`) means the page technically cannot send files out, and anyone can verify that in DevTools.
- **Shipping:** free on GitHub Pages; every push runs the tests and deploys.

**Why it should be appreciated:** everyone needs it; it gives a concrete answer to "where do my files go?"; it is used from a single link; the code is small, readable and tested; adding a language is easy, which makes contributing easy.

## Method note

Data was gathered by web search. Some numbers come from vendor surveys (Smallpdf) or third-party traffic estimates (Semrush), so read them as orders of magnitude rather than exact values. The McKinsey and IDC figures are old (2012) but point the same way as recent surveys.
