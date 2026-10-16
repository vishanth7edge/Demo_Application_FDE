"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TRIVIAL = /^[{}()[\];,]*$/;
function normalizeLines(content) {
    const out = [];
    const raw = content.split('\n');
    for (let i = 0; i < raw.length; i++) {
        const t = raw[i]
            .replace(/\/\/.*$/, '')
            .replace(/\/\*.*?\*\//g, '')
            .trim();
        if (!t)
            continue;
        if (t.startsWith('import '))
            continue;
        if (t.startsWith('export {') || t === 'export {};')
            continue;
        if (TRIVIAL.test(t))
            continue;
        out.push({ text: t, lineNum: i + 1 });
    }
    return out;
}
// djb2 — fast, deterministic, good enough for line deduplication
function hashLine(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return h;
}
// Extend a seed match (fileA[seedA] === fileB[seedB]) in both directions.
// Returns the maximal matching run that contains the seed.
function extendRun(normA, normB, seedA, seedB) {
    let startA = seedA, startB = seedB;
    while (startA > 0 && startB > 0 && normA[startA - 1].text === normB[startB - 1].text) {
        startA--;
        startB--;
    }
    let endA = seedA, endB = seedB;
    while (endA + 1 < normA.length && endB + 1 < normB.length &&
        normA[endA + 1].text === normB[endB + 1].text) {
        endA++;
        endB++;
    }
    return { startA, startB, length: endA - startA + 1 };
}
const noDuplicateBlocks = {
    id: 'reusability/no-duplicate-blocks',
    name: 'No Duplicate Blocks',
    description: 'Detects copy-pasted code blocks across files using a line-hash index with greedy extension.',
    severity: 'warning',
    category: 'reusability',
    check(context, options) {
        const minLines = options?.minLines ?? 6;
        const violations = [];
        // Step 1: normalize qualifying files
        const fileNorm = new Map();
        for (const file of context.files) {
            const p = file.relativePath;
            if (!p.endsWith('.ts') && !p.endsWith('.tsx'))
                continue;
            if (p.endsWith('.d.ts'))
                continue;
            if (p.includes('__tests__') || p.includes('.test.') || p.includes('.spec.'))
                continue;
            const lines = normalizeLines(file.content);
            if (lines.length >= minLines)
                fileNorm.set(p, lines);
        }
        // Step 2: build per-line hash index
        // lineIndex: hash → [{file, lineIdx}] across all files
        const lineIndex = new Map();
        for (const [filePath, lines] of fileNorm) {
            for (let i = 0; i < lines.length; i++) {
                const h = hashLine(lines[i].text);
                if (!lineIndex.has(h))
                    lineIndex.set(h, []);
                lineIndex.get(h).push({ file: filePath, lineIdx: i });
            }
        }
        // Step 3: find cross-file duplicate blocks
        // reportedRanges prevents the same (file, lineIdx) from being claimed twice,
        // which would happen if the same block appears again from a different seed line.
        const reportedRanges = new Map(); // file → set of covered lineIdx
        function isCovered(file, start, len) {
            const s = reportedRanges.get(file);
            if (!s)
                return false;
            for (let i = start; i < start + len; i++)
                if (s.has(i))
                    return true;
            return false;
        }
        function markCovered(file, start, len) {
            if (!reportedRanges.has(file))
                reportedRanges.set(file, new Set());
            const s = reportedRanges.get(file);
            for (let i = start; i < start + len; i++)
                s.add(i);
        }
        for (const [, occurrences] of lineIndex) {
            // If a line is extremely common (e.g. `return null;`), it has too many
            // pairs to be useful — skip it. This also bounds worst-case work.
            if (occurrences.length > 50)
                continue;
            // Generate all cross-file pairs from this seed line
            for (let i = 0; i < occurrences.length; i++) {
                for (let j = i + 1; j < occurrences.length; j++) {
                    const a = occurrences[i];
                    const b = occurrences[j];
                    if (a.file === b.file)
                        continue;
                    const normA = fileNorm.get(a.file);
                    const normB = fileNorm.get(b.file);
                    // Guard against hash collisions
                    if (normA[a.lineIdx].text !== normB[b.lineIdx].text)
                        continue;
                    const { startA, startB, length } = extendRun(normA, normB, a.lineIdx, b.lineIdx);
                    if (length < minLines)
                        continue;
                    // Skip if fileB's range is already covered by a previously reported run
                    if (isCovered(b.file, startB, length))
                        continue;
                    markCovered(b.file, startB, length);
                    const absPath = context.files.find(f => f.relativePath === b.file)?.path ?? b.file;
                    violations.push({
                        ruleId: 'reusability/no-duplicate-blocks',
                        ruleName: 'No Duplicate Blocks',
                        severity: 'warning',
                        category: 'reusability',
                        message: `Duplicate code block (${length} lines) — also found in "${a.file}" at line ${normA[startA].lineNum}.`,
                        filePath: absPath,
                        relativePath: b.file,
                        line: normB[startB].lineNum,
                        suggestion: 'Extract the shared logic into a reusable function, hook, or utility.',
                    });
                }
            }
        }
        return violations;
    },
};
exports.default = noDuplicateBlocks;
//# sourceMappingURL=no-duplicate-blocks.js.map