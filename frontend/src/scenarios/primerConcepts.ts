// Vibe2Real — Primer Concept Library
// First-principles explanations for every scenario concept
// Diagrams use ASCII art — fits the terminal aesthetic

export interface PrimerConcept {
    id: string;
    title: string;
    oneLiner: string;                  // Plain English, one sentence
    whyItMatters: string;              // Why a vibe coder will hit this
    diagram: string;                   // ASCII diagram — monospace art
    mindMap: MindMapNode;              // Concept relationships
    keyFacts: string[];                // 3 digestible bullet points
    realWorldAnalogy: string;          // Everyday comparison
}

export interface MindMapNode {
    label: string;
    children: { label: string; note?: string }[];
}

const concepts: Record<string, PrimerConcept> = {

    // -- 1.1 -----------------------------------------------------------------
    'env-vars': {
        id: 'env-vars',
        title: 'Environment Variables',
        oneLiner: 'An environment variable is a named secret your app reads from the machine running it — not from the code itself.',
        whyItMatters: 'AI tools write code that reads from .env files. When you deploy, that file stays local and production gets nothing — breaking everything silently.',
        diagram: `
  YOUR MACHINE              PRODUCTION SERVER
  -------------             -----------------
  .env file exists          .env file MISSING
  +--------------+          +--------------+
  | VITE_API_BASE|          | VITE_API_BASE|
  | = localhost  |          | = ???        |
  +------+-------+          +------+-------+
         |                         |
    code reads it             code reads it
         |                         |
  [OK]  "http://api.local"      [FAIL]  undefined
         |                         |
  [OK]  fetch works             [FAIL]  fetch("undefined/users")
                                   |
                             TypeError: Failed to fetch
`,
        mindMap: {
            label: 'Environment Variables',
            children: [
                { label: '.env file', note: 'local only, never committed' },
                { label: 'process.env', note: 'how code reads them' },
                { label: 'Production env', note: 'set in Vercel / Railway dashboard' },
                { label: 'Build-time vs Runtime', note: 'VITE_ prefix = build-time' },
            ],
        },
        keyFacts: [
            '.env files are intentionally excluded from git — they are never deployed automatically',
            'VITE_ prefix means the value is baked in at build time, not at runtime',
            'When the variable is missing, the value is undefined — not an error, which is why it breaks silently',
        ],
        realWorldAnalogy: 'Like a password stored in your browser\'s saved passwords — it works on your laptop, but if you log in on a new machine, it\'s not there.',
    },

    // -- 1.2 -----------------------------------------------------------------
    'http-routing': {
        id: 'http-routing',
        title: 'HTTP Routing',
        oneLiner: 'A route is an address. The server reads the URL path and decides which code handles the request.',
        whyItMatters: 'Vibe coders set up API routes in one framework and call them from another. A prefix mismatch means requests silently go to the wrong address and return 404.',
        diagram: `
  CLIENT                        SERVER
  ------                        ------
  fetch("/api/users")           Routes registered:
       |                        +-----------------+
       | HTTP Request           | /v1/api/users [OK] |
       +----------------------> | /api/users   [FAIL]  |
                                +-----------------+
                                        |
                 Request path            |
                 doesn't match any route |
                                         v
                                   404 Not Found

  Fix: match the prefix
  fetch("/v1/api/users") ------> /v1/api/users [OK] → 200 OK
`,
        mindMap: {
            label: 'HTTP Routing',
            children: [
                { label: 'URL path', note: '/api/users — the address' },
                { label: 'Route handler', note: 'function that responds' },
                { label: 'Prefix mismatch', note: 'most common silent bug' },
                { label: '404 Not Found', note: 'route didn\'t match anything' },
            ],
        },
        keyFacts: [
            'Routes are matched left to right — /api and /v1/api are completely different addresses',
            'A 404 means the server received the request but no route matched — not a network error',
            'Proxy configs (Vite, Next.js) can rewrite paths, adding invisible prefixes',
        ],
        realWorldAnalogy: 'Like a building with office numbers. You came to room 404 but the company is in room 1404. Both exist, different floors.',
    },

    // -- 1.3 -----------------------------------------------------------------
    'api-response': {
        id: 'api-response',
        title: 'API Response Shape',
        oneLiner: 'An API returns data in a specific shape — nested objects, arrays, wrapper keys. If you read the wrong key, you get undefined silently.',
        whyItMatters: 'AI generates code that often assumes a flat response. Real APIs wrap data in {data: {...}} or {results: [...]} — the 200 says "ok" but the data is one level deeper than expected.',
        diagram: `
  API RESPONSE                  YOUR CODE ASSUMES
  ------------                  -----------------
  {                             response.name
    "status": "ok",                  |
    "data": {                        |  reads TOP level
      "name": "Alice",               |
      "email": "a@b.com"             v
    }                          undefined  ← silent!
  }
  
  Correct:
  response.data.name  ------>  "Alice"  [OK]
  
  The 200 OK fools you — the request worked.
  The shape is what broke the display.
`,
        mindMap: {
            label: 'API Response Shape',
            children: [
                { label: 'Status code', note: '200 = request ok, not data ok' },
                { label: 'Response body', note: 'the actual JSON payload' },
                { label: 'Nested keys', note: '.data, .results, .payload' },
                { label: 'undefined', note: 'wrong key = silent nothing' },
            ],
        },
        keyFacts: [
            'HTTP 200 means the server replied — it says nothing about whether the data is what you expected',
            'Most real APIs wrap data: { data: {...} } or { results: [...] } — never assume flat',
            'undefined in JavaScript doesn\'t throw — it silently propagates, making the bug invisible',
        ],
        realWorldAnalogy: 'You ordered a package. It arrived (200 OK). But the item is inside a box inside another box — you looked in the outer box and said "it\'s empty".',
    },

    // -- 1.4 -----------------------------------------------------------------
    'event-handlers': {
        id: 'event-handlers',
        title: 'React Event Handlers',
        oneLiner: 'A button does nothing unless something is listening. In React, props wire the listener — if the prop isn\'t passed, the handler never fires.',
        whyItMatters: 'Vibe coders build components in isolation, then compose them. A parent forgets to pass onClick and the button looks fine — but clicking it does nothing. No error.',
        diagram: `
  PARENT COMPONENT             CHILD COMPONENT
  -----------------            ---------------
  
  [FAIL] Missing prop:
  <Button label="Save" />      function Button({ label, onSave }) {
                                 return (
  onSave is undefined             <button onClick={onSave}>
                                    {label}
                                  </button>
  Button renders fine ------>   );
  Click fires nothing           }
  No error. Silent.
  
  [OK] Fix: pass the prop
  <Button 
    label="Save" 
    onSave={handleSave}  -->  onClick={onSave}  → fires!
  />
`,
        mindMap: {
            label: 'React Event Handlers',
            children: [
                { label: 'Props', note: 'data passed from parent to child' },
                { label: 'onClick', note: 'fires when element is clicked' },
                { label: 'undefined prop', note: 'onClick={undefined} = silent noop' },
                { label: 'Component interface', note: 'props are a contract' },
            ],
        },
        keyFacts: [
            'onClick={undefined} doesn\'t crash — React ignores it, making the button visually functional but behaviorally dead',
            'Components are isolated units — they have no idea what the parent forgot to pass',
            'This is why console.log(props) is the most useful debugging step in React',
        ],
        realWorldAnalogy: 'A doorbell wired with a cable that isn\'t plugged in at the other end. The button looks real. Pressing it does nothing. No error light.',
    },

    // -- 1.5 -----------------------------------------------------------------
    'package-versions': {
        id: 'package-versions',
        title: 'Package Versions & Peer Dependencies',
        oneLiner: 'Libraries have versions. A peer dependency says "I need version X of Y to exist alongside me" — if X is wrong, things break silently or strangely.',
        whyItMatters: 'AI fills package.json quickly, often mixing incompatible versions. A library built for React 17 running inside React 18 may fail silently or render incorrectly.',
        diagram: `
  package.json                YOUR node_modules
  ------------                -----------------
  "react": "^18.0"            react @ 18.2.0  [OK]
  "some-lib": "^1.0"          some-lib @ 1.0  [OK]
                              
  some-lib peer deps:
  "peerDependencies": {       Problem:
    "react": "^17.0"  ------> lib expects React 17
  }                           but got React 18
                                     |
                               Components render
                               incorrectly or fail
                               silently
  
  Fix: upgrade some-lib to version that supports React 18
`,
        mindMap: {
            label: 'Package Versions',
            children: [
                { label: 'dependencies', note: 'runtime packages' },
                { label: 'peerDependencies', note: 'what the lib expects host to provide' },
                { label: 'semver', note: '^1.0 = any 1.x, ~1.0 = any 1.0.x' },
                { label: 'version mismatch', note: 'often silent breakage' },
            ],
        },
        keyFacts: [
            'Peer dependencies are not installed automatically — the host app must provide the right version',
            '^18.0 means "compatible with 18.x" — a library needing ^17.0 will conflict with your 18.x',
            'npm ls <package> shows you what version is actually installed',
        ],
        realWorldAnalogy: 'A USB-C cable that requires USB3 ports, but you only have USB2. It fits physically. But it won\'t transfer at the speed it expects.',
    },

    // -- 2.1 -----------------------------------------------------------------
    'console-errors': {
        id: 'console-errors',
        title: 'Reading Console Errors',
        oneLiner: 'The browser console tells you exactly what broke, where in the code it broke, and what the value was — before you touch anything.',
        whyItMatters: 'Vibe coders\' first instinct is to change code. But the console already has the answer — a stack trace pointing to a specific file and line.',
        diagram: `
  BROWSER CONSOLE
  ---------------
  [FAIL] Uncaught TypeError: Cannot read properties 
    of undefined (reading 'map')
    
    at UserList (UserList.tsx:14)   <-- exact file & line
    at App (App.tsx:6)
  
  Translation:
  |
  ├- "TypeError" = type mismatch (wrong shape of data)
  ├- "undefined" = something that should be an array is not
  ├- ".map" = you tried to loop over it
  +- "UserList.tsx:14" = go look at line 14
  
  Line 14: users.map(u => <User key={u.id} {...u} />)
                |
           users is undefined — not yet loaded, or API failed
`,
        mindMap: {
            label: 'Console Errors',
            children: [
                { label: 'Error type', note: 'TypeError, ReferenceError, etc.' },
                { label: 'Error message', note: 'what went wrong' },
                { label: 'Stack trace', note: 'exact file and line number' },
                { label: 'Source maps', note: 'makes minified code readable' },
            ],
        },
        keyFacts: [
            'The stack trace shows the call chain — read top to bottom, your code is usually the first user entry',
            'TypeError usually means undefined or null where an object was expected',
            'Console errors in production show in the Network tab → XHR responses, not just the console',
        ],
        realWorldAnalogy: 'Your car breaks down and a warning light tells you exactly which sensor failed. Most people ignore the light and start randomly checking parts.',
    },

    // -- 2.2 -----------------------------------------------------------------
    'http-status': {
        id: 'http-status',
        title: 'HTTP Status Codes',
        oneLiner: 'Every HTTP response includes a 3-digit code telling you what happened — 2xx means ok, 4xx means your mistake, 5xx means server mistake.',
        whyItMatters: 'AI-generated try/catch blocks often swallow the status code silently. A 401 Unauthorized looks like success if you don\'t check response.ok.',
        diagram: `
  HTTP RESPONSE CODES
  -------------------
  200  OK              --> Request succeeded
  201  Created         --> New thing was made
  204  No Content      --> Success, nothing returned
  
  400  Bad Request     --> You sent wrong data
  401  Unauthorized    --> Not logged in / bad token
  403  Forbidden       --> Logged in, but not allowed
  404  Not Found       --> That URL doesn't exist
  422  Unprocessable   --> Validation failed
  
  500  Server Error    --> Server crashed
  503  Unavailable     --> Server is down
  
  try {
    const res = await fetch('/api/me')
    const data = await res.json()   ← 401 still reaches here!
    setUser(data)                   ← data = { error: 'Unauthorized' }
  } catch (e) {
    // only catches network errors, NOT 4xx/5xx
  }
`,
        mindMap: {
            label: 'HTTP Status Codes',
            children: [
                { label: '2xx Success', note: 'request worked' },
                { label: '4xx Client Error', note: 'problem with your request' },
                { label: '5xx Server Error', note: 'problem on their end' },
                { label: 'response.ok', note: 'true only for 200-299' },
            ],
        },
        keyFacts: [
            'fetch() only throws on network failure — a 404 or 401 still "succeeds" as far as try/catch knows',
            'Always check response.ok or response.status before parsing the body as real data',
            'The Network tab in DevTools shows the actual status code — not the caught error message',
        ],
        realWorldAnalogy: 'Sending a letter. The post office confirms delivery (200) or returns it (404). But with code, people often assume delivery without checking if the address existed.',
    },

    // -- 2.3 -----------------------------------------------------------------
    'network-waterfall': {
        id: 'network-waterfall',
        title: 'Network Waterfall',
        oneLiner: 'A waterfall is when requests happen one after another — each waiting for the one before. One slow request blocks everything after it.',
        whyItMatters: 'AI backends often call third-party APIs before responding to the frontend. If that API is slow, your entire page waits.',
        diagram: `
  NETWORK WATERFALL (DevTools Timeline)
  --------------------------------------
  
  Time ---------------------------------->
  
  /page          ████ 50ms
  /api/me              ████ 100ms
  /api/posts                ████████████ 3000ms  <-- BLOCKER
  /api/comments                                   ████ (waiting...)
  /static/img                                          ████
  
  Problem:
  /api/posts calls Stripe API internally --> Stripe is slow
  Everything after waits.
  
  Fix:
  Move Stripe call to background job,
  or cache the result,
  or call in parallel with Promise.all()
`,
        mindMap: {
            label: 'Network Waterfall',
            children: [
                { label: 'Sequential requests', note: 'one blocks the next' },
                { label: 'Parallel requests', note: 'Promise.all() = simultaneous' },
                { label: 'Third-party APIs', note: 'external latency you don\'t control' },
                { label: 'TTFB', note: 'Time to First Byte — key metric' },
            ],
        },
        keyFacts: [
            'The Network tab in DevTools shows a visual waterfall — wide bars are slow requests, stacked = sequential',
            'A slow TTFB usually means the server is blocked waiting for a database or external API',
            'Promise.all() makes requests run in parallel — Promise.all([fetch(a), fetch(b)]) is 2x faster than awaiting each',
        ],
        realWorldAnalogy: 'A restaurant where each dish is only started after the previous one is fully eaten. One slow eater delays the whole kitchen.',
    },

    // -- 2.4 -----------------------------------------------------------------
    'cors': {
        id: 'cors',
        title: 'CORS — Cross-Origin Resource Sharing',
        oneLiner: 'CORS is the browser\'s security check that asks servers "is this website allowed to read your data?" — if the server doesn\'t say yes, the browser blocks the response.',
        whyItMatters: 'A CORS error in the console is almost never the actual problem — it\'s the browser blocking a request that already failed for another reason (usually 500 or auth).',
        diagram: `
  BROWSER            YOUR FRONTEND         YOUR BACKEND
  -------            -------------         ------------
  
  1. You navigate to: http://localhost:3000
  2. JS runs: fetch("https://api.example.com/users")
  
  BROWSER CHECK:
  "Wait — page is on localhost:3000
   but request goes to api.example.com
   Different origin! Check if allowed."
              |
              v
  Preflight OPTIONS request ------------------>
                             Does server reply with
  <-- Access-Control-Allow-Origin: * (or localhost)?
              |
    YES ------+------> request proceeds --> 200 OK
              |
    NO  ------+------> CORS ERROR in console
              |
              +--> But the server already responded!
                   The 500 error is hidden by the CORS block
`,
        mindMap: {
            label: 'CORS',
            children: [
                { label: 'Origin', note: 'protocol + domain + port' },
                { label: 'Preflight', note: 'OPTIONS request browser sends first' },
                { label: 'Allow-Origin header', note: 'server\'s permission response' },
                { label: 'Hidden errors', note: 'CORS often masks a 500 underneath' },
            ],
        },
        keyFacts: [
            'CORS is enforced by the browser — curl and Postman ignore it entirely',
            'A CORS error often means the server already crashed (500) — check Network tab for the real status code',
            'Fix CORS on the server by adding the Access-Control-Allow-Origin header, not on the frontend',
        ],
        realWorldAnalogy: 'A bouncer at a club (browser) who won\'t let you in without the venue\'s permission slip (CORS header). But the bouncer doesn\'t know the venue is on fire inside — he just sees: no slip.',
    },

    // -- 2.5 -----------------------------------------------------------------
    'http-caching': {
        id: 'http-caching',
        title: 'HTTP Caching',
        oneLiner: 'Caching stores a copy of a response so future requests skip the server entirely — great for speed, destructive when your update isn\'t showing.',
        whyItMatters: 'Vibe coders deploy an update but users see old data. The cache is serving last week\'s response. No error, just wrong data.',
        diagram: `
  FIRST REQUEST           CACHED REQUEST
  -------------           --------------
  Browser --> Server      Browser --> Cache (local)
          <-- Response            <-- Stored copy
  Header:                 No network request made.
  Cache-Control:          
  max-age=86400          86400 seconds = 24 hours
  (store for 24 hrs)     
  
  You deploy update at 2pm.
  Cache expires at midnight.
  Users see OLD version for 10 hours. No error.
  
  Cache-Control options:
  no-cache         --> always revalidate with server
  no-store         --> never cache
  max-age=0        --> expired immediately  
  s-maxage=3600    --> CDN cache, 1 hour
`,
        mindMap: {
            label: 'HTTP Caching',
            children: [
                { label: 'Cache-Control', note: 'header controlling cache behavior' },
                { label: 'max-age', note: 'seconds before stale' },
                { label: 'ETag', note: 'unique ID for content version' },
                { label: 'Service Worker', note: 'browser-level cache, very aggressive' },
            ],
        },
        keyFacts: [
            'Cache-Control: max-age=86400 means the browser won\'t hit the server for 24 hours',
            'Service Workers can cache assets indefinitely — even after a deploy',
            'Hard refresh (Cmd+Shift+R) bypasses browser cache but not CDN or Service Worker cache',
        ],
        realWorldAnalogy: 'A newspaper printed on Monday. You bought a copy. Tuesday\'s edition is out — but you\'re reading Monday\'s because you already have it.',
    },

    // -- 3.1 -----------------------------------------------------------------
    'deployment-logs': {
        id: 'deployment-logs',
        title: 'Deployment Logs',
        oneLiner: 'Deployment logs are the full printed output of your build, install, and start process — when production breaks, logs tell you exactly which step failed.',
        whyItMatters: 'Vibe coders check the app URL when it breaks. The answer is in the logs, not the browser. The browser just shows a blank 500 page.',
        diagram: `
  DEPLOYMENT PROCESS (CI/CD)
  ---------------------------
  Step 1: git pull          [OK]  done
  Step 2: npm ci            [OK]  done
  Step 3: npm run build     [OK]  done
  Step 4: npm start         [FAIL]  FAILED
  
  Log output:
  Error: Cannot find module 'express'
    at Function.Module._resolveFilename
    
  Why? The deploy script ran:
  git pull
  npm run build
  npm start         <-- skipped npm install!
  
  express is in node_modules (local)
  node_modules is in .gitignore
  Production has NO node_modules
`,
        mindMap: {
            label: 'Deployment Logs',
            children: [
                { label: 'Build log', note: 'compile / bundle output' },
                { label: 'Runtime log', note: 'what happens after start' },
                { label: 'Exit code', note: '0 = success, anything else = failure' },
                { label: 'Railway / Vercel logs', note: 'where to find them' },
            ],
        },
        keyFacts: [
            'node_modules is never deployed — npm install must run on the server explicitly',
            'A "module not found" error in production means the install step was skipped or incomplete',
            'Logs show timestamps — correlate the error time to when you deployed',
        ],
        realWorldAnalogy: 'Moving to a new apartment. You moved your furniture (code) but forgot to tell the movers to bring food (node_modules). You arrive and there\'s nothing to eat.',
    },

    // -- 3.2 -----------------------------------------------------------------
    'git-conflicts': {
        id: 'git-conflicts',
        title: 'Git Merge Conflicts',
        oneLiner: 'A merge conflict means two people changed the same line — Git can\'t guess which version is right, so it asks you to decide.',
        whyItMatters: 'Vibe coders accept their version blindly. But the other version might have fixed a critical bug — losing it breaks production.',
        diagram: `
  BRANCH A (your changes)       BRANCH B (teammate)
  -----------------------       ---------------------
  const PORT = 3001;            const PORT = 8080;
  
  After merge attempt:
  <<<<<<< HEAD (your branch)
  const PORT = 3001;
  =======
  const PORT = 8080;
  >>>>>>> feature/new-config
  
  Git is saying:
  "Both branches changed this line.
   You tell me which one wins."
  
  Resolution options:
  1. Keep yours:    const PORT = 3001;
  2. Keep theirs:   const PORT = 8080;
  3. Combine both:  const PORT = process.env.PORT || 3001;
  
  [!] Do not blindly accept without reading both sides.
`,
        mindMap: {
            label: 'Git Merge Conflicts',
            children: [
                { label: 'HEAD', note: 'your current branch' },
                { label: 'Incoming', note: 'the branch being merged in' },
                { label: 'Conflict markers', note: '<<<<, ====, >>>> delimiters' },
                { label: 'Intent', note: 'understand WHY each change was made' },
            ],
        },
        keyFacts: [
            'Conflict markers (<<<<< ===== >>>>>) must be removed — leaving them breaks the file',
            'The right resolution requires understanding why each branch made the change, not just what changed',
            'git log --oneline on each branch shows the commit history to understand intent',
        ],
        realWorldAnalogy: 'Two editors rewrote the same paragraph of an article. The publisher can\'t merge them automatically — someone needs to understand both edits\' intent and write the final version.',
    },

    // -- 3.3 -----------------------------------------------------------------
    'git-history': {
        id: 'git-history',
        title: 'Git History: Revert vs Reset',
        oneLiner: 'git revert adds a new commit that undoes a mistake — git reset erases commits permanently. Never reset on a shared branch.',
        whyItMatters: 'Vibe coders under pressure want to "just undo it." reset --hard feels fast. But it erases history and breaks teammates\' copies of the branch.',
        diagram: `
  git log (before fix):
  A -- B -- C (bad commit) -- HEAD
  
  -------------------------------------------------
  git revert C
  A -- B -- C -- D (reverts C)  ← safe, history kept
  
  [OK] Other devs can still pull
  [OK] C is still in history (auditable)
  [OK] Safe on production branches
  
  -------------------------------------------------
  git reset --hard B
  A -- B -- HEAD  (C is gone from YOUR copy)
  
  [FAIL] Other devs still have C — conflict on next push
  [FAIL] C is unrecoverable (unless in reflog < 30 days)
  [FAIL] Force push to main = team chaos
`,
        mindMap: {
            label: 'Git History',
            children: [
                { label: 'git revert', note: 'creates undo commit, safe' },
                { label: 'git reset', note: 'moves HEAD back, dangerous' },
                { label: 'reflog', note: 'git\'s emergency undo for 30 days' },
                { label: 'force push', note: 'overwrites remote — destructive' },
            ],
        },
        keyFacts: [
            'git revert is always safe on shared branches — it adds history, never removes it',
            'git reset --hard loses uncommitted changes permanently with no recovery',
            'git reflog is your last resort — it remembers every HEAD position for 30 days',
        ],
        realWorldAnalogy: 'revert is like writing a correction notice in a newspaper — the mistake is still there but so is the fix. reset is like burning every copy of yesterday\'s paper.',
    },

    // -- 3.4 -----------------------------------------------------------------
    'build-config': {
        id: 'build-config',
        title: 'Build Config Differences (Local vs CI)',
        oneLiner: 'Local dev and CI/CD are different machines with different tools — a config that works locally may not exist in the CI environment.',
        whyItMatters: 'Vibe coders set up path aliases, plugins, or env vars locally and forget to replicate them in CI. "Works on my machine" is the hardest bug to debug.',
        diagram: `
  YOUR MACHINE              CI / PRODUCTION
  ------------              ---------------
  
  vite.config.ts            webpack.config.ts
  alias: {                  (no alias configured)
    "@": "./src"            
  }                         import MyComp from "@/components/MyComp"
                                          |
  import "@/MyComp" --> [OK]               | Cannot resolve module "@/components/MyComp"
  works perfectly                         |
                                          [FAIL] Build fails
  
  Why?
  Vite handles "@" alias locally
  CI might use Webpack, or different
  Vite config, or different paths
  
  Fix: tsconfig.json paths + webpack resolve.alias
`,
        mindMap: {
            label: 'Build Config',
            children: [
                { label: 'Path aliases', note: '@/ instead of ../../' },
                { label: 'tsconfig paths', note: 'TypeScript level alias' },
                { label: 'Bundler config', note: 'Vite vs Webpack resolution' },
                { label: 'CI environment', note: 'often missing local customizations' },
            ],
        },
        keyFacts: [
            'TypeScript paths (@/) are a compile hint only — bundlers need their own alias config ',
            'CI machines start fresh every time — they have only what\'s in the repo',
            'Always test with npm run build locally before pushing — it simulates CI',
        ],
        realWorldAnalogy: 'You\'ve memorized a shortcut route that only you know. A delivery driver following map directions doesn\'t know your shortcut — they get lost.',
    },

    // -- 3.5 -----------------------------------------------------------------
    'processes': {
        id: 'processes',
        title: 'OS Processes & Ports',
        oneLiner: 'A process is a running program with a unique ID (PID). Two processes cannot share the same port — one wins, one fails.',
        whyItMatters: 'Vibe coders restart "the server" but the old process is still running. The new one can\'t bind port 3000 — it crashes or the old version keeps serving.',
        diagram: `
  RUNNING PROCESSES (ps aux | grep node)
  ----------------------------------------
  PID   COMMAND
  1234  node dist/server.js --port 3000  ← OLD server (crashed?)
  5678  node dist/server.js --port 3000  ← NEW server you started
  
  Problem:
  PID 1234 is still holding port 3000
  PID 5678 fails: "address already in use"
  
  You curl localhost:3000 --> hits PID 1234 (old version)
  Your fix is in PID 5678 --> never gets traffic
  
  Fix:
  lsof -i :3000 --> shows which PID holds port 3000
  kill -9 1234  --> terminates the old process
  PID 5678 now binds port 3000  --> your fix is live
`,
        mindMap: {
            label: 'Processes & Ports',
            children: [
                { label: 'PID', note: 'Process ID — unique per running program' },
                { label: 'Port', note: 'numbered door on your machine (3000, 8080)' },
                { label: 'lsof -i :PORT', note: 'shows what owns a port' },
                { label: 'kill -9 PID', note: 'force-terminates a process' },
            ],
        },
        keyFacts: [
            'Only one process can listen on a port at a time — "EADDRINUSE" means something else got there first',
            'ps aux | grep node shows all running Node processes — you might be surprised how many exist',
            'lsof -i :3000 shows the exact PID holding port 3000 so you kill the right one',
        ],
        realWorldAnalogy: 'Two taxi drivers both assigned to spot #1 at the airport. The first one there keeps the spot. The second one has to go elsewhere — but customers expecting cab #1 get the old driver.',
    },
};

export function getConcept(id: string): PrimerConcept | undefined {
    return concepts[id];
}

export default concepts;
