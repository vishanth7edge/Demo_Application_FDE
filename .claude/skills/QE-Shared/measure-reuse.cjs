#!/usr/bin/env node
'use strict';

/**
 * measure-reuse.cjs — deterministic TRM (Test Reuse Metrics) computation.
 *
 * Companion script to the trm-audit skill, same philosophy as
 * .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs: parsing every page class, step
 * definition, and feature file is pure computation — routing that through the model
 * burns tokens on work a script does deterministically and faster. This script does
 * the full Layer 1/2/3 scan AND emits file-and-line violations matching
 * TRM_FRAMEWORK.md, so SKILL.md only has to read the JSON output and format the
 * report — not re-open every file itself.
 *
 * No npm dependencies (qa-pack ships none) — Node core only. Repo-agnostic: pass
 * --pages-dir/--steps-dir/--features-glob/--base-page-file explicitly (SKILL.md's
 * Step 0 discovery should do this), or let it auto-discover common patterns below.
 *
 *   node .claude/skills/QE-Shared/measure-reuse.cjs [--flags]
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ─── CLI ARGS ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    }
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));

// ─── DEPENDENCY-FREE GLOB (replaces the `glob` npm package) ────────────────
// Supports the two patterns this script needs: `<dir>/**/*.ext` and a wildcard
// directory segment like `test/E2E*/**/*.feature`. `*` matches within one path
// segment; `**` matches zero or more path segments. Good enough for repo-scan
// globs — not a general-purpose glob engine.
function segToRegex(seg) {
  const escaped = seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}
function globSync(pattern) {
  const segments = pattern.replace(/\\/g, '/').split('/').filter(Boolean);
  const results = [];
  function walk(dir, segIdx) {
    if (segIdx >= segments.length) return;
    const seg = segments[segIdx];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (seg === '**') {
      if (segIdx === segments.length - 1) return; // '**' must be followed by a final segment
      walk(dir, segIdx + 1); // zero extra segments consumed
      for (const e of entries) {
        if (e.isDirectory() && e.name !== 'node_modules') walk(path.join(dir, e.name), segIdx);
      }
      return;
    }
    const isLast = segIdx === segments.length - 1;
    const re = segToRegex(seg);
    for (const e of entries) {
      if (!re.test(e.name)) continue;
      const full = path.join(dir, e.name);
      if (isLast) { if (e.isFile()) results.push(full); }
      else if (e.isDirectory()) walk(full, segIdx + 1);
    }
  }
  walk(ROOT, 0);
  return results.map((p) => path.relative(ROOT, p).replace(/\\/g, '/'));
}
function firstExisting(candidates) {
  return candidates.find((c) => fs.existsSync(path.join(ROOT, c))) || null;
}

// ─── CONFIG — flags > auto-discovery, never hardcoded to one repo ──────────
function resolveConfig() {
  const pagesDir = args['pages-dir']
    || firstExisting(['test/Pages', 'test/pages', 'Pages', 'pages']);
  const stepsDir = args['steps-dir']
    // preserves a repo's own typo'd convention (e.g. step-definations) — never "fixes" it
    || firstExisting(['test/step-definitions', 'test/step-definations', 'step-definitions', 'step-definations']);
  const basePageName = args['base-page-name'] || 'BasePage';
  const basePageFile = args['base-page-file']
    || (pagesDir && (() => {
      const hit = globSync(`${pagesDir}/**/*.cjs`).find((f) => {
        const c = fs.readFileSync(path.join(ROOT, f), 'utf-8');
        return new RegExp(`class\\s+${basePageName}\\b`).test(c);
      });
      return hit || null;
    })())
    || firstExisting(['test/Utils/BasePage.cjs', 'test/utils/BasePage.cjs']);
  const featuresGlob = args['features-glob']
    || (firstExisting(['test/features', 'features', 'test/E2E']) ? `${firstExisting(['test/features', 'features', 'test/E2E'])}/**/*.feature` : null)
    || 'test/**/*.feature';
  const outputDir = args['output-dir'] || 'outputs/trm';
  const projectName = args['project-name']
    || (() => {
      try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).name; }
      catch { return path.basename(ROOT); }
    })();

  return { pagesDir, basePageFile, basePageName, stepsDir, featuresGlob, outputDir, projectName };
}
const CONFIG = resolveConfig();

// ─────────────────────────────────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  'constructor', 'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try', 'do',
  'return', 'throw', 'new', 'delete', 'typeof', 'void', 'instanceof', 'in', 'of', 'super',
  'await', 'yield', 'async', 'get', 'set', 'static', 'class', 'extends', 'import', 'export',
  'const', 'let', 'var', 'function', 'true', 'false', 'null', 'undefined',
]);

// Methods BasePage is supposed to own (TRM_FRAMEWORK.md §1) — a page class redefining
// one of these, or a hardcoded-wait/raw-goto method under any name, is a Layer 1 violation.
const BASEPAGE_GENERIC_METHODS = new Set([
  'navigateTo', 'waitForPageReady', 'getCurrentUrl', 'getTitle', 'verifyTextOnPage',
  'navigateToDashboard', 'click', 'fill', 'heal',
]);

function readFile(relPath) { return fs.readFileSync(path.join(ROOT, relPath), 'utf-8'); }
function lineOf(content, index) { return content.slice(0, index).split('\n').length; }
function countNonEmptyLines(content) { return content.split('\n').filter((l) => l.trim().length > 0).length; }

// strip full-line JS comments so commented-out step registrations / code don't get parsed as active
function removeLineComments(content) {
  return content.split('\n').map((line) => (line.trimStart().startsWith('//') ? '' : line)).join('\n');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── LAYER 1: Page Object Model ─────────────────────────────────────────────

function extractClassInfo(relPath) {
  const content = readFile(relPath);
  const classes = [];
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g;
  let classMatch;

  while ((classMatch = classRegex.exec(content)) !== null) {
    const className = classMatch[1];
    const superClass = classMatch[2] || null;
    const classStart = classMatch.index + classMatch[0].length;

    let depth = 1;
    let pos = classStart;
    while (pos < content.length && depth > 0) {
      if (content[pos] === '{') depth++;
      else if (content[pos] === '}') depth--;
      pos++;
    }
    const classBody = content.substring(classStart, pos - 1);

    // Direct class members sit at 2-space indent (prettier-standard); anything
    // inside a method/constructor body is indented 4+ spaces. This is the same
    // indentation assumption the method regex below relies on.
    const methods = [];
    const methodRegex = /^  (?:async\s+)?(\w+)\s*\(/gm;
    let m;
    while ((m = methodRegex.exec(classBody)) !== null) {
      const name = m[1];
      if (JS_KEYWORDS.has(name) || methods.some((mm) => mm.name === name)) continue;

      // Brace-match the actual method body — a fixed-length slice here would
      // leak the START of the NEXT method into a short method's "body" and
      // cause false-positive content matches (goto/waitForTimeout) attributed
      // to the wrong method.
      let pPos = methodRegex.lastIndex; // just after the matched '('
      let pDepth = 1;
      while (pPos < classBody.length && pDepth > 0) {
        if (classBody[pPos] === '(') pDepth++;
        else if (classBody[pPos] === ')') pDepth--;
        pPos++;
      }
      const bracePos = classBody.indexOf('{', pPos);
      let bodySlice = '';
      if (bracePos !== -1) {
        let depth = 1;
        let pos = bracePos + 1;
        while (pos < classBody.length && depth > 0) {
          if (classBody[pos] === '{') depth++;
          else if (classBody[pos] === '}') depth--;
          pos++;
        }
        bodySlice = classBody.slice(bracePos + 1, pos - 1);
      }
      methods.push({ name, line: lineOf(content, classStart + m.index), bodySlice });
    }

    // Locator-outside-constructor: a 2-space-indented field assignment to a
    // locator call is, by the same indentation logic, NOT inside any method —
    // including the constructor.
    const fieldLocatorRegex = /^  (\w+)\s*=\s*(?:this\.)?page\.(?:locator|getBy\w*)\s*\(/gm;
    const fieldViolations = [];
    let fm;
    while ((fm = fieldLocatorRegex.exec(classBody)) !== null) {
      fieldViolations.push({ field: fm[1], line: lineOf(content, classStart + fm.index) });
    }

    classes.push({ className, superClass, methods, fieldViolations, filePath: relPath });
  }
  return classes;
}

function analyzePageObjects() {
  if (!CONFIG.pagesDir) {
    return { basePageMethods: [], pageClasses: [], violations: [], summary: { totalPageClasses: 0, classesExtendingBase: 0, basePageMethodCount: 0, totalPageSpecificMethods: 0, totalMethods: 0, baseRatioPercent: 0, inheritanceRatioPercent: 0, verdict: 'NEEDS WORK', note: 'No pages directory found — pass --pages-dir explicitly.' } };
  }

  const pageFiles = globSync(`${CONFIG.pagesDir}/**/*.cjs`).concat(globSync(`${CONFIG.pagesDir}/**/*.js`));

  let basePageMethods = [];
  const violations = [];

  if (CONFIG.basePageFile && fs.existsSync(path.join(ROOT, CONFIG.basePageFile))) {
    const info = extractClassInfo(CONFIG.basePageFile);
    const base = info.find((c) => c.className === CONFIG.basePageName);
    if (base) {
      basePageMethods = base.methods.map((m) => m.name);
      // BasePage itself must never contain page-specific locators.
      base.fieldViolations.forEach((fv) => {
        violations.push({
          type: 'basePageContainsLocator',
          file: CONFIG.basePageFile,
          line: fv.line,
          detail: `BasePage field '${fv.field}' is a page-specific locator`,
          fix: `Move '${fv.field}' out of BasePage into the one page class that needs it.`,
        });
      });
    }
  } else {
    violations.push({ type: 'basePageNotFound', file: CONFIG.basePageFile || '(not found)', detail: 'Could not locate the BasePage class file', fix: 'Pass --base-page-file explicitly.' });
  }

  const pageClasses = [];
  const methodOwners = new Map(); // methodName -> [{className, file}]

  pageFiles.forEach((filePath) => {
    extractClassInfo(filePath).forEach((cls) => {
      if (cls.className === CONFIG.basePageName) return;
      pageClasses.push(cls);

      if (cls.superClass !== CONFIG.basePageName) {
        violations.push({
          type: 'notExtendingBasePage',
          file: filePath,
          detail: `class ${cls.className} ${cls.superClass ? `extends ${cls.superClass}` : '(no extends clause)'}`,
          fix: `Change to \`class ${cls.className} extends ${CONFIG.basePageName} {\`.`,
        });
      }

      cls.fieldViolations.forEach((fv) => {
        violations.push({
          type: 'locatorOutsideConstructor',
          file: filePath,
          line: fv.line,
          detail: `Locator field '${fv.field}' declared outside the constructor`,
          fix: `Move '${fv.field} = ...' inside the constructor.`,
        });
      });

      cls.methods.forEach((m) => {
        if (/\.page\.goto\s*\(|(?<!wait)\bgoto\s*\(/.test(m.bodySlice) || BASEPAGE_GENERIC_METHODS.has(m.name)) {
          violations.push({
            type: 'genericMethodInPageClass',
            file: filePath,
            line: m.line,
            detail: `Method '${m.name}' looks like a generic BasePage responsibility, redefined in ${cls.className}`,
            fix: `Remove '${m.name}' from ${cls.className}; use the inherited BasePage method instead (or move the shared logic into BasePage if BasePage doesn't have it yet).`,
          });
        }
        if (/waitForTimeout\s*\(/.test(m.bodySlice)) {
          violations.push({
            type: 'hardcodedWait',
            file: filePath,
            line: m.line,
            detail: `Method '${m.name}' uses waitForTimeout(...)`,
            fix: 'Replace with an explicit wait (e.g. toBeVisible()/waitForPageReady()) — never a fixed sleep.',
          });
        }
        if (!methodOwners.has(m.name)) methodOwners.set(m.name, []);
        methodOwners.get(m.name).push({ className: cls.className, file: filePath, line: m.line });
      });
    });
  });

  // Cross-file shared-method rule (§1): a method name repeated across 2+ page
  // classes, not already a BasePage method, is a consolidation candidate.
  // Heuristic by name only — flagged as a *candidate*, not an auto-fact; the
  // audit report should note these need a quick human look before merging.
  for (const [name, owners] of methodOwners.entries()) {
    if (owners.length >= 2 && !basePageMethods.includes(name)) {
      violations.push({
        type: 'sharedMethodCandidate',
        file: owners.map((o) => o.file).join(', '),
        detail: `Method '${name}' appears in ${owners.length} page classes (${owners.map((o) => o.className).join(', ')}) — candidate for consolidation into BasePage`,
        fix: `If these implementations are identical/near-identical, move '${name}' into BasePage and delete the per-page copies.`,
      });
    }
  }

  const allPageSpecificMethods = pageClasses.reduce((acc, c) => acc + c.methods.length, 0);
  const totalMethods = basePageMethods.length + allPageSpecificMethods;
  const baseRatioPercent = totalMethods > 0 ? parseFloat(((basePageMethods.length / totalMethods) * 100).toFixed(1)) : 0;
  const classesExtendingBase = pageClasses.filter((c) => c.superClass === CONFIG.basePageName).length;
  const inheritanceRatioPercent = pageClasses.length > 0 ? parseFloat(((classesExtendingBase / pageClasses.length) * 100).toFixed(1)) : 0;

  return {
    basePageMethods,
    pageClasses: pageClasses.map((c) => ({
      name: c.className, file: c.filePath, extendsBase: c.superClass === CONFIG.basePageName,
      superClass: c.superClass, methodCount: c.methods.length,
    })),
    violations,
    summary: {
      basePageMethodCount: basePageMethods.length,
      totalPageSpecificMethods: allPageSpecificMethods,
      totalMethods, baseRatioPercent,
      totalPageClasses: pageClasses.length,
      classesExtendingBase, inheritanceRatioPercent,
      verdict: inheritanceRatioPercent >= 90 ? 'GOOD' : inheritanceRatioPercent >= 60 ? 'MODERATE' : 'NEEDS WORK',
    },
  };
}

// ── LAYER 2: Step Definition Analysis ─────────────────────────────────────

const STEP_REGEX = /(Given|When|Then|And|But)\s*\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/g;

function extractStepPatterns(relPath) {
  const raw = readFile(relPath);
  const content = removeLineComments(raw);
  const steps = [];
  STEP_REGEX.lastIndex = 0;
  let m;
  while ((m = STEP_REGEX.exec(content)) !== null) {
    const pattern = (m[2] || m[3] || m[4] || '').replace(/\s+/g, ' ').trim();
    if (pattern && pattern.length < 300) steps.push({ type: m[1], pattern, file: relPath, line: lineOf(raw, m.index) });
  }
  return steps;
}

function patternToRegex(pattern) {
  const marked = pattern
    .replace(/\{string\}/g, '\x00STR\x00').replace(/\{int\}/g, '\x00INT\x00')
    .replace(/\{float\}/g, '\x00FLT\x00').replace(/\{word\}/g, '\x00WRD\x00')
    .replace(/\{[^}]*\}/g, '\x00ANY\x00');
  const escaped = marked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped
    .replace(/\x00STR\x00/g, '"[^"]*"').replace(/\x00INT\x00/g, '\\d+')
    .replace(/\x00FLT\x00/g, '[\\d.]+').replace(/\x00WRD\x00/g, '\\S+').replace(/\x00ANY\x00/g, '.*?');
  return new RegExp(`^${regexStr}$`, 'i');
}

// TRM_FRAMEWORK.md §2 — the five master switch patterns, matched loosely enough to
// recognize a repo's exact wording (persona name may differ from "John").
const MASTER_SWITCH_PATTERNS = {
  navigation: /is (?:on|in) the \{string\} page/i,
  dataEntry: /enters the \{string\}/i,
  button: /submits with the \{string\} button/i,
  toastAssertion: /should read a message stating \{string\}/i,
  confirmation: /confirms the \{string\}/i,
};

// Keyword heuristics to bucket a *single-use* (non-master-switch) step by action
// type — best-effort text classification, not a guarantee; the report should read
// as "candidate for bucket X", which SKILL.md already frames it as.
function classifyStep(pattern) {
  const p = pattern.toLowerCase();
  // Leading \b only (no trailing \b) on verb stems — plain-English inflections
  // (enters/entering, clicks/clicking) directly append to the stem with no
  // boundary in between, so a trailing \b would never match them.
  if (/\bconfirm/.test(p)) return 'confirmation';
  if (/\b(should see|message|toast|success|error|alert|notification)\b/.test(p)) return 'toastAssertion';
  if (/\b(click|submit|button|press|tap)/.test(p)) return 'button';
  if (/\b(enter|fill|type|input|select)/.test(p)) return 'dataEntry';
  if (/\b(page|navigate|is on|go(es)? to)\b/.test(p)) return 'navigation';
  return 'unclassified';
}

// Detects each of the five master-switch patterns INDEPENDENTLY across every step
// file — a repo splitting them across e.g. navigationSteps.cjs + commonSteps.cjs is
// legitimate and must not be reported as "no master switch found" (that would tell
// the report/Step 3 to CREATE a new file, generating a step that collides with the
// one that already exists — an `Ambiguous` error in cucumber-js, not an improvement).
function findMasterSwitchFile(stepFiles) {
  const byPattern = {};
  const filesUsed = new Set();

  for (const [key, re] of Object.entries(MASTER_SWITCH_PATTERNS)) {
    for (const file of stepFiles) {
      const content = removeLineComments(readFile(file));
      if (!re.test(content)) continue;
      const caseRegex = /case\s+['"]([^'"]+)['"]/g;
      byPattern[key] = { file, cases: [...content.matchAll(caseRegex)].map((m) => m[1]) };
      filesUsed.add(file);
      break; // first file that defines this pattern wins; a second definition of the
             // same pattern elsewhere would itself be a duplicate-step problem, out of scope here
    }
  }

  const missingPatterns = Object.keys(MASTER_SWITCH_PATTERNS).filter((k) => !byPattern[k]);
  return {
    found: Object.keys(byPattern).length > 0,
    files: [...filesUsed],
    byPattern,
    missingPatterns,
  };
}

function analyzeStepDefinitions() {
  if (!CONFIG.stepsDir) {
    return {
      stepPatterns: [],
      singleUseSteps: { navigation: [], dataEntry: [], button: [], toastAssertion: [], confirmation: [], unclassified: [] },
      masterSwitch: { found: false, files: [], byPattern: {}, missingPatterns: Object.keys(MASTER_SWITCH_PATTERNS) },
      summary: { totalStepDefinitions: 0, reusedAcrossMultipleFeaturesOrMasterSwitch: 0, unusedStepDefinitions: 0, singleUseTotal: 0, stepReusabilityPercent: 0, verdict: 'NEEDS WORK', note: 'No step-definitions directory found — pass --steps-dir explicitly.' },
    };
  }

  const stepFiles = globSync(`${CONFIG.stepsDir}/**/*.cjs`).concat(globSync(`${CONFIG.stepsDir}/**/*.js`))
    .filter((f) => !path.basename(f).startsWith('Driver') && !f.includes('coverageData'));
  const featureFiles = globSync(CONFIG.featuresGlob);

  const allPatterns = stepFiles.flatMap((f) => extractStepPatterns(f));
  const compiled = allPatterns.map((s) => {
    try { return { ...s, regex: patternToRegex(s.pattern) }; } catch { return null; }
  }).filter(Boolean);

  const usedInFeatures = compiled.map(() => new Set());
  featureFiles.forEach((featurePath) => {
    const lines = readFile(featurePath).split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim().replace(/^(Given|When|Then|And|But)\s+/, '');
      if (!trimmed || trimmed.length < 3) return;
      compiled.forEach((step, i) => {
        try { if (step.regex.test(trimmed)) usedInFeatures[i].add(featurePath); } catch { /* skip broken regex */ }
      });
    });
  });

  const enriched = compiled.map((s, i) => ({
    type: s.type, pattern: s.pattern, file: s.file, line: s.line,
    usedInFeaturesCount: usedInFeatures[i].size,
    isMasterSwitchStep: Object.values(MASTER_SWITCH_PATTERNS).some((re) => re.test(s.pattern)),
  }));

  const masterSwitch = findMasterSwitchFile(stepFiles);

  // The metric TRM_FRAMEWORK.md §2 actually targets: steps used in EXACTLY 1
  // feature file, excluding the master-switch steps themselves (those are reused
  // by design via their internal cases, not by feature-file count).
  const singleUse = enriched.filter((s) => s.usedInFeaturesCount === 1 && !s.isMasterSwitchStep);
  const singleUseSteps = { navigation: [], dataEntry: [], button: [], toastAssertion: [], confirmation: [], unclassified: [] };
  singleUse.forEach((s) => singleUseSteps[classifyStep(s.pattern)].push(s));

  const totalSteps = enriched.length;
  const reusedSteps = enriched.filter((s) => s.usedInFeaturesCount > 1 || s.isMasterSwitchStep).length;
  const unusedSteps = enriched.filter((s) => s.usedInFeaturesCount === 0).length;
  const stepReusabilityPercent = totalSteps > 0 ? parseFloat(((reusedSteps / totalSteps) * 100).toFixed(1)) : 0;

  return {
    stepPatterns: enriched,
    singleUseSteps,
    masterSwitch,
    summary: {
      totalStepDefinitions: totalSteps,
      reusedAcrossMultipleFeaturesOrMasterSwitch: reusedSteps,
      unusedStepDefinitions: unusedSteps,
      singleUseTotal: singleUse.length,
      stepReusabilityPercent,
      verdict: stepReusabilityPercent >= 70 ? 'GOOD' : stepReusabilityPercent >= 40 ? 'MODERATE' : 'NEEDS WORK',
    },
  };
}

// ── LAYER 3: Gherkin Coverage + format violations ─────────────────────────

const TECH_DETAIL_RE = /(id=["'][\w-]+["']|#[\w-]+["']|\.[\w-]+["']|waitForTimeout|\bsleep\s*\(|querySelector|getElementBy)/i;
const EMAIL_RE = /"[^"]*@[^"]*"/;

function analyzeGherkin() {
  const featureFiles = globSync(CONFIG.featuresGlob);
  const stepFiles = CONFIG.stepsDir
    ? globSync(`${CONFIG.stepsDir}/**/*.cjs`).concat(globSync(`${CONFIG.stepsDir}/**/*.js`))
      .filter((f) => !path.basename(f).startsWith('Driver') && !f.includes('coverageData'))
    : [];

  let totalFeatureLines = 0;
  const featureStats = [];
  const violations = [];

  featureFiles.forEach((f) => {
    const content = readFile(f);
    const lines = content.split('\n');
    totalFeatureLines += countNonEmptyLines(content);
    featureStats.push({ file: f, lines: countNonEmptyLines(content) });

    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      const trimmed = line.trim();
      if (/^Scenario:\s/.test(trimmed)) {
        violations.push({ type: 'scenarioKeyword', file: f, line: lineNo, detail: `Uses 'Scenario:' keyword`, fix: `Replace with 'Rule:' + 'Example:'` });
      }
      // Mask quoted email-like literals before the technical-detail check — the
      // CSS-class heuristic (`\.[\w-]+["']`) otherwise matches ".com"" at the
      // end of any quoted email and misreports it as a CSS-selector violation.
      const maskedForTechCheck = trimmed.replace(EMAIL_RE, '"EMAIL"');
      if (TECH_DETAIL_RE.test(maskedForTechCheck) && /^(Given|When|Then|And|But)\s/.test(trimmed)) {
        violations.push({ type: 'technicalDetail', file: f, line: lineNo, detail: `Step contains technical detail: '${trimmed.slice(0, 100)}'`, fix: 'Rewrite using a master-step pattern with a dynamic parameter, not a locator/DOM/CSS reference.' });
      }
      if (EMAIL_RE.test(trimmed) && /^(Given|When|Then|And|But)\s/.test(trimmed)) {
        violations.push({ type: 'hardcodedData', file: f, line: lineNo, detail: `Hardcoded literal data in step: '${trimmed.slice(0, 100)}'`, fix: `Replace the literal with a category name, e.g. When John enters the "login credentials"` });
      }
    });
  });

  let totalStepRegistrations = 0;
  stepFiles.forEach((f) => {
    const content = removeLineComments(readFile(f));
    STEP_REGEX.lastIndex = 0;
    let m;
    while ((m = STEP_REGEX.exec(content)) !== null) {
      const pattern = (m[2] || m[3] || m[4] || '').replace(/\s+/g, ' ').trim();
      if (pattern && pattern.length < 300) totalStepRegistrations++;
    }
  });

  const ratio = totalStepRegistrations > 0 ? parseFloat((totalFeatureLines / totalStepRegistrations).toFixed(2)) : 0;

  let totalScenarios = 0;
  featureFiles.forEach((f) => {
    const lines = readFile(f).split('\n');
    let inExamples = false, headerSeen = false;
    lines.forEach((line) => {
      const t = line.trim();
      if (/^Scenario:\s/.test(t) || (/^Example:/.test(t) && !/^Examples:/.test(t))) { totalScenarios++; inExamples = false; }
      else if (/^Scenario Outline:/.test(t)) { inExamples = false; }
      else if (/^Examples:/.test(t)) { inExamples = true; headerSeen = false; }
      else if (inExamples && t.startsWith('|')) { if (!headerSeen) headerSeen = true; else totalScenarios++; }
      else if (inExamples && t && !t.startsWith('#')) { inExamples = false; }
    });
  });

  return {
    featureStats: featureStats.sort((a, b) => b.lines - a.lines),
    violations,
    summary: {
      totalFeatureFiles: featureFiles.length,
      totalFeatureLines,
      totalStepDefinitionFiles: stepFiles.length,
      totalStepRegistrations,
      totalScenarios,
      featureToStepRatio: ratio,
      verdict: 'TRACKING',
      benchmark: 'No universal E2E benchmark — track this ratio over time as the suite grows',
    },
  };
}

// ── HTML Report (generalized branding, adds a violations summary) ─────────

function verdictColor(v) {
  if (v === 'GOOD') return '#22c55e';
  if (v === 'MODERATE') return '#f59e0b';
  if (v === 'TRACKING') return '#60a5fa';
  return '#ef4444';
}
function verdictBadge(v) {
  return `<span style="background:${verdictColor(v)};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;">${v}</span>`;
}

function generateHtmlReport(report) {
  const { pom, steps, gherkin, generatedAt, projectName } = report;
  const violationRows = (list, cap = 30) => list.slice(0, cap).map((v) =>
    `<tr><td style="font-family:monospace;font-size:11px;color:#94a3b8;">${escapeHtml(v.file)}${v.line ? ':' + v.line : ''}</td>` +
    `<td>${escapeHtml(v.type)}</td><td>${escapeHtml(v.detail)}</td></tr>`
  ).join('');

  const allViolations = [...pom.violations, ...gherkin.violations];
  const singleUseCount = Object.values(steps.singleUseSteps || {}).reduce((a, l) => a + l.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Test Reuse Metrics — ${escapeHtml(projectName)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;padding:32px;min-width:320px}
h1{font-size:26px;font-weight:700;margin-bottom:4px}
.subtitle{color:#94a3b8;font-size:13px;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-bottom:28px}
.card{background:#1e2130;border:1px solid #2d3148;border-radius:12px;padding:22px}
.card-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:10px}
.big-num{font-size:40px;font-weight:700;line-height:1;margin-bottom:8px}
.big-num.good{color:#22c55e}.big-num.moderate{color:#f59e0b}.big-num.bad{color:#ef4444}
.meta{font-size:12px;color:#94a3b8;margin-top:8px;line-height:1.6}
.bar{background:#252838;border-radius:999px;height:7px;margin-top:12px;overflow:hidden}
.bar-fill{height:7px;border-radius:999px}
.section{background:#1e2130;border:1px solid #2d3148;border-radius:12px;padding:22px;margin-bottom:22px}
.sec-hd{font-size:17px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sec-desc{font-size:12px;color:#94a3b8;margin-bottom:18px}
.stat-row{display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px}
.stat-lbl{color:#94a3b8}.stat-val{font-weight:600}
.tbl-wrap{overflow-x:auto;margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:9px 11px;background:#252838;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
td{padding:9px 11px;border-top:1px solid #2d3148;vertical-align:top}
tr:hover td{background:#252838}
.tbl-label{margin-top:18px;margin-bottom:8px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
footer{text-align:center;color:#475569;font-size:11px;margin-top:36px;padding-top:20px;border-top:1px solid #2d3148}
</style>
</head>
<body>
<h1>🧪 Test Reuse Metrics</h1>
<p class="subtitle">Generated: ${generatedAt} &nbsp;·&nbsp; Playwright + CucumberJS BDD &nbsp;·&nbsp; ${escapeHtml(projectName)}</p>

<div class="grid">
  <div class="card">
    <div class="card-title">Layer 1 — POM Inheritance</div>
    <div class="big-num ${pom.summary.verdict === 'GOOD' ? 'good' : pom.summary.verdict === 'MODERATE' ? 'moderate' : 'bad'}">${pom.summary.inheritanceRatioPercent}%</div>
    <div>${verdictBadge(pom.summary.verdict)}</div>
    <div class="meta">${pom.summary.classesExtendingBase}/${pom.summary.totalPageClasses} pages extend BasePage<br>${pom.violations.length} violation(s)</div>
    <div class="bar"><div class="bar-fill" style="width:${Math.min(pom.summary.inheritanceRatioPercent, 100)}%;background:${verdictColor(pom.summary.verdict)}"></div></div>
  </div>
  <div class="card">
    <div class="card-title">Layer 2 — Step Reuse</div>
    <div class="big-num ${steps.summary.verdict === 'GOOD' ? 'good' : steps.summary.verdict === 'MODERATE' ? 'moderate' : 'bad'}">${steps.summary.stepReusabilityPercent}%</div>
    <div>${verdictBadge(steps.summary.verdict)}</div>
    <div class="meta">${steps.summary.singleUseTotal} single-use of ${steps.summary.totalStepDefinitions} total<br>Master switch: ${steps.masterSwitch.found ? 'found' : 'MISSING'}</div>
    <div class="bar"><div class="bar-fill" style="width:${Math.min(steps.summary.stepReusabilityPercent, 100)}%;background:${verdictColor(steps.summary.verdict)}"></div></div>
  </div>
  <div class="card">
    <div class="card-title">Layer 3 — Feature:Step Ratio</div>
    <div class="big-num" style="color:#60a5fa">${gherkin.summary.featureToStepRatio}:1</div>
    <div>${verdictBadge(gherkin.summary.verdict)}</div>
    <div class="meta">${gherkin.summary.totalFeatureLines} feature lines · ${gherkin.summary.totalStepRegistrations} steps<br>${gherkin.violations.length} Gherkin format violation(s)</div>
    <div class="bar"><div class="bar-fill" style="width:${Math.min(gherkin.summary.featureToStepRatio * 10, 100)}%;background:#60a5fa"></div></div>
  </div>
</div>

<div class="section">
  <div class="sec-hd">📦 Layer 1 Violations ${verdictBadge(pom.summary.verdict)}</div>
  <div class="sec-desc">${pom.violations.length} finding(s).</div>
  ${pom.violations.length ? `<div class="tbl-wrap"><table><thead><tr><th>File</th><th>Type</th><th>Detail</th></tr></thead><tbody>${violationRows(pom.violations)}</tbody></table></div>` : '<p>✓ No violations.</p>'}
</div>

<div class="section">
  <div class="sec-hd">🔗 Layer 2 — Single-use steps ${verdictBadge(steps.summary.verdict)}</div>
  <div class="sec-desc">${singleUseCount} single-use step(s) across 5 buckets — see JSON for full per-bucket lists.</div>
  <div class="stat-row"><span class="stat-lbl">Navigation</span><span class="stat-val">${steps.singleUseSteps.navigation.length}</span></div>
  <div class="stat-row"><span class="stat-lbl">Data entry</span><span class="stat-val">${steps.singleUseSteps.dataEntry.length}</span></div>
  <div class="stat-row"><span class="stat-lbl">Button</span><span class="stat-val">${steps.singleUseSteps.button.length}</span></div>
  <div class="stat-row"><span class="stat-lbl">Toast assertion</span><span class="stat-val">${steps.singleUseSteps.toastAssertion.length}</span></div>
  <div class="stat-row"><span class="stat-lbl">Confirmation</span><span class="stat-val">${steps.singleUseSteps.confirmation.length}</span></div>
  <div class="stat-row"><span class="stat-lbl">Unclassified</span><span class="stat-val">${steps.singleUseSteps.unclassified.length}</span></div>
</div>

<div class="section">
  <div class="sec-hd">📄 Layer 3 Violations ${verdictBadge('TRACKING')}</div>
  <div class="sec-desc">${gherkin.violations.length} finding(s).</div>
  ${gherkin.violations.length ? `<div class="tbl-wrap"><table><thead><tr><th>File</th><th>Type</th><th>Detail</th></tr></thead><tbody>${violationRows(gherkin.violations)}</tbody></table></div>` : '<p>✓ No violations.</p>'}
</div>

<footer>Generated by measure-reuse.cjs (trm-audit skill) &nbsp;·&nbsp; ${generatedAt}</footer>
</body>
</html>`;
}

// ── MAIN ─────────────────────────────────────────────────────────────────

function run() {
  if (!args['json-only']) console.log('\n🔍 Test Reuse Metrics — Starting analysis...\n');

  fs.mkdirSync(path.join(ROOT, CONFIG.outputDir), { recursive: true });

  const pom = analyzePageObjects();
  const steps = analyzeStepDefinitions();
  const gherkin = analyzeGherkin();

  const report = { generatedAt: new Date().toISOString(), projectName: CONFIG.projectName, config: CONFIG, pom, steps, gherkin };

  const jsonPath = path.join(CONFIG.outputDir, 'reuse-report.json');
  fs.writeFileSync(path.join(ROOT, jsonPath), JSON.stringify(report, null, 2));

  if (!args['json-only']) {
    const htmlPath = path.join(CONFIG.outputDir, 'reuse-report.html');
    fs.writeFileSync(path.join(ROOT, htmlPath), generateHtmlReport(report));
    console.log(`  Layer 1: ${pom.summary.inheritanceRatioPercent}% (${pom.summary.classesExtendingBase}/${pom.summary.totalPageClasses}) | ${pom.violations.length} violations | ${pom.summary.verdict}`);
    console.log(`  Layer 2: ${steps.summary.stepReusabilityPercent}% reuse | ${steps.summary.singleUseTotal} single-use | master switch patterns found in: ${steps.masterSwitch.files.length ? steps.masterSwitch.files.join(', ') : 'NONE'}${steps.masterSwitch.missingPatterns.length ? ' (missing: ' + steps.masterSwitch.missingPatterns.join(', ') + ')' : ''}`);
    console.log(`  Layer 3: ${gherkin.summary.featureToStepRatio}:1 | ${gherkin.violations.length} Gherkin violations\n`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}\n`);
  } else {
    console.log(jsonPath);
  }
}

run();
