(function () {
    const INO = `/* portfolio.ino — Jan Andre Nicol */
#define LED_POWER 7
#define LED_TX    8
#define LED_CYAN 13

void setup() {
  Serial.begin(9600);
  pinMode(LED_POWER, OUTPUT);
  pinMode(LED_TX, OUTPUT);
  pinMode(LED_CYAN, OUTPUT);
  digitalWrite(LED_POWER, HIGH);
  Serial.println("boot ok");
}

void loop() {
  digitalWrite(LED_CYAN, HIGH);
  Serial.println("ping");
  delay(300);
  digitalWrite(LED_TX, HIGH);
  delay(100);
  digitalWrite(LED_CYAN, LOW);
  delay(600);
}
`;

    const CS = `// Program.cs — ingest device events
var app = WebApplication.Create();

app.MapPost("/api/device/ping", async (HttpContext ctx) =>
{
    var evt = await ctx.Request.ReadFromJsonAsync<DeviceEvent>();
    _logger.LogInformation("device {id} ping at {t}",
        evt.DeviceId, evt.Timestamp);
    await _repo.InsertAsync(evt);
    return Results.Ok(new { status = "recorded" });
});

app.Run();
`;

    const KEYWORDS = {
        c: new Set(['void', 'int', 'char', 'long', 'short', 'unsigned', 'signed',
            'float', 'double', 'bool', 'if', 'else', 'while', 'for', 'return',
            'break', 'continue', 'switch', 'case', 'default', 'struct', 'typedef',
            'static', 'const', 'true', 'false', 'HIGH', 'LOW', 'INPUT', 'OUTPUT',
            'INPUT_PULLUP']),
        cs: new Set(['var', 'async', 'await', 'return', 'public', 'private',
            'protected', 'class', 'new', 'void', 'int', 'string', 'bool', 'if',
            'else', 'while', 'for', 'foreach', 'in', 'using', 'namespace',
            'static', 'readonly', 'const', 'true', 'false', 'null', 'record'])
    };

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function tokenize(code, lang) {
        const kw = KEYWORDS[lang];
        const tokens = [];
        let i = 0;
        let atLineStart = true;
        while (i < code.length) {
            const rest = code.slice(i);
            let m;

            if (m = rest.match(/^\/\*[\s\S]*?\*\//)) {
                tokens.push({ type: 'comment', value: m[0] });
            } else if (m = rest.match(/^\/\/[^\n]*/)) {
                tokens.push({ type: 'comment', value: m[0] });
            } else if (lang === 'c' && atLineStart && (m = rest.match(/^#\w+/))) {
                tokens.push({ type: 'preproc', value: m[0] });
            } else if (m = rest.match(/^"(?:[^"\\]|\\.)*"/)) {
                tokens.push({ type: 'string', value: m[0] });
            } else if (m = rest.match(/^\d+(\.\d+)?/)) {
                tokens.push({ type: 'number', value: m[0] });
            } else if (m = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
                const word = m[0];
                let type = 'ident';
                if (kw.has(word)) type = 'keyword';
                else if (/^[A-Z][A-Z0-9_]{2,}$/.test(word)) type = 'type';
                else if (code[i + word.length] === '(') type = 'func';
                tokens.push({ type, value: word });
            } else if (m = rest.match(/^[ \t]+/)) {
                tokens.push({ type: 'ws', value: m[0] });
            } else if (code[i] === '\n') {
                tokens.push({ type: 'nl', value: '\n' });
                i += 1;
                atLineStart = true;
                continue;
            } else {
                tokens.push({ type: 'other', value: code[i] });
                i += 1;
                atLineStart = false;
                continue;
            }
            i += m[0].length;
            atLineStart = false;
        }
        return tokens;
    }

    function tokenToHtml(tok) {
        const v = escapeHtml(tok.value);
        if (tok.type === 'ident' || tok.type === 'other' || tok.type === 'ws' || tok.type === 'nl') return v;
        return `<span class="t-${tok.type}">${v}</span>`;
    }

    // Build line-wrapped HTML from tokens, rendering only the first `count` visible characters.
    function renderUpTo(tokens, count) {
        const lines = [];
        let curLine = '';
        let lineNo = 1;

        function pushLine() {
            lines.push(`<div class="code-line"><span class="ln">${lineNo}</span><span class="lc">${curLine}</span></div>`);
            curLine = '';
            lineNo += 1;
        }

        let remaining = count;
        let caretPlaced = false;
        for (let i = 0; i < tokens.length; i++) {
            const tok = tokens[i];
            if (remaining <= 0) break;
            if (tok.type === 'nl') {
                pushLine();
                remaining -= 1;
                continue;
            }
            if (remaining >= tok.value.length) {
                curLine += tokenToHtml(tok);
                remaining -= tok.value.length;
            } else {
                const partial = { type: tok.type, value: tok.value.slice(0, remaining) };
                curLine += tokenToHtml(partial);
                curLine += '<span class="code-caret"></span>';
                caretPlaced = true;
                remaining = 0;
                break;
            }
        }
        // Push the last (incomplete) line if any content
        if (curLine.length > 0 || lines.length === 0) {
            if (!caretPlaced) curLine += '<span class="code-caret"></span>';
            pushLine();
        }
        return lines.join('');
    }

    // Total visible chars = sum of token lengths (newlines count as 1)
    function totalChars(tokens) {
        let n = 0;
        for (const t of tokens) n += (t.type === 'nl' ? 1 : t.value.length);
        return n;
    }

    // Build a list of (charPos, action) LED triggers by scanning the source.
    function buildTriggers(source, mapping) {
        const triggers = [];
        for (const [needle, action] of mapping) {
            let idx = 0;
            while ((idx = source.indexOf(needle, idx)) !== -1) {
                // Count visible chars up to and including this match.
                const charPos = idx + needle.length;
                triggers.push({ at: charPos, action });
                idx += needle.length;
            }
        }
        triggers.sort((a, b) => a.at - b.at);
        return triggers;
    }

    function firePulse(name) {
        if (window.arduinoBoard && typeof window.arduinoBoard.pulse === 'function') {
            window.arduinoBoard.pulse(name);
        }
    }
    function firePulseAll() {
        if (window.arduinoBoard && typeof window.arduinoBoard.pulseAll === 'function') {
            window.arduinoBoard.pulseAll();
        }
    }

    function runTyper(targetEl, source, tokens, triggers, opts, onDone) {
        const { typeMs, pauseOnLineMs } = opts;
        let pos = 0;
        let firedCount = 0;
        const total = totalChars(tokens);

        function step() {
            pos = Math.min(total, pos + 1);
            targetEl.innerHTML = renderUpTo(tokens, pos);

            // Auto-scroll to bottom so caret stays visible
            const scroller = targetEl.closest('.code-body');
            if (scroller) scroller.scrollTop = scroller.scrollHeight;

            // Fire any triggers newly reached
            while (firedCount < triggers.length && triggers[firedCount].at <= pos) {
                triggers[firedCount].action();
                firedCount += 1;
            }

            if (pos >= total) {
                if (onDone) onDone();
                return;
            }
            // Extra pause at line ends for natural rhythm
            const justHitNewline = source[pos - 1] === '\n';
            setTimeout(step, justHitNewline ? pauseOnLineMs : typeMs);
        }
        step();
    }

    function init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Render static highlighted output and stop.
            const inoTokens = tokenize(INO, 'c');
            const csTokens = tokenize(CS, 'cs');
            document.getElementById('codeBodyIno').innerHTML = renderUpTo(inoTokens, totalChars(inoTokens));
            document.getElementById('codeBodyCs').innerHTML = renderUpTo(csTokens, totalChars(csTokens));
            return;
        }

        const inoEl = document.getElementById('codeBodyIno');
        const csEl = document.getElementById('codeBodyCs');
        if (!inoEl || !csEl) return;

        const inoTokens = tokenize(INO, 'c');
        const csTokens = tokenize(CS, 'cs');

        const inoTriggers = buildTriggers(INO, [
            ['digitalWrite(LED_POWER, HIGH)', () => firePulse('power')],
            ['digitalWrite(LED_CYAN, HIGH)',  () => firePulse('cyan')],
            ['digitalWrite(LED_TX, HIGH)',    () => firePulse('tx')],
            ['Serial.println("boot ok")',     () => firePulseAll()],
            ['Serial.println("ping")',        () => firePulse('tx')],
        ]);
        const csTriggers = buildTriggers(CS, [
            ['Results.Ok', () => firePulse('cyan')],
            ['app.Run()',  () => firePulseAll()],
        ]);

        function startCycle() {
            inoEl.textContent = '';
            csEl.textContent = '';
            runTyper(inoEl, INO, inoTokens, inoTriggers, { typeMs: 22, pauseOnLineMs: 140 }, () => {
                setTimeout(() => {
                    runTyper(csEl, CS, csTokens, csTriggers, { typeMs: 22, pauseOnLineMs: 140 }, () => {
                        setTimeout(startCycle, 3500);
                    });
                }, 500);
            });
        }

        startCycle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
