"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = analyzeProject;
exports.findAllDuplicates = findAllDuplicates;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// ─── Category map ────────────────────────────────────────────────────────────
// Maps package name → functional categories. Used to detect duplicates.
const CATEGORY_MAP = {
    // HTTP clients
    axios: ['http-client'], got: ['http-client'], ky: ['http-client'],
    'node-fetch': ['http-client'], superagent: ['http-client'], undici: ['http-client'],
    'cross-fetch': ['http-client'], 'isomorphic-fetch': ['http-client'],
    wretch: ['http-client'], ofetch: ['http-client'],
    // Date / time
    'date-fns': ['date'], dayjs: ['date'], moment: ['date'], luxon: ['date'],
    'date-fns-tz': ['date'], chrono: ['date'],
    // Validation / schema
    zod: ['validation'], yup: ['validation'], joi: ['validation'],
    valibot: ['validation'], superstruct: ['validation'], ajv: ['validation'],
    'class-validator': ['validation'],
    // State management
    zustand: ['state'], jotai: ['state'], recoil: ['state'],
    redux: ['state'], '@reduxjs/toolkit': ['state'],
    mobx: ['state'], 'mobx-react': ['state'], 'mobx-react-lite': ['state'],
    xstate: ['state'], valtio: ['state'], nanostores: ['state'],
    pinia: ['state'], vuex: ['state'],
    // Data fetching / async cache
    'react-query': ['data-fetching'], '@tanstack/react-query': ['data-fetching'],
    swr: ['data-fetching'], '@tanstack/query-core': ['data-fetching'],
    apollo: ['data-fetching'], '@apollo/client': ['data-fetching'],
    urql: ['data-fetching'],
    // Routing
    'react-router': ['router'], 'react-router-dom': ['router'],
    'next/router': ['router'], 'next/navigation': ['router'],
    'vue-router': ['router'], wouter: ['router'], '@reach/router': ['router'],
    // Form handling
    'react-hook-form': ['forms'], formik: ['forms'], 'final-form': ['forms'],
    '@tanstack/react-form': ['forms'],
    // UI component libraries
    '@mui/material': ['ui-kit'], 'antd': ['ui-kit'], 'chakra-ui': ['ui-kit'],
    '@chakra-ui/react': ['ui-kit'], 'mantine': ['ui-kit'], '@mantine/core': ['ui-kit'],
    'shadcn-ui': ['ui-kit'], 'radix-ui': ['ui-kit'],
    // CSS-in-JS / styling
    'styled-components': ['css-in-js'], '@emotion/react': ['css-in-js'],
    '@emotion/styled': ['css-in-js'], 'linaria': ['css-in-js'],
    'stitches': ['css-in-js'], '@stitches/react': ['css-in-js'],
    vanilla_extract: ['css-in-js'], '@vanilla-extract/css': ['css-in-js'],
    // Utility / functional
    lodash: ['utility'], 'lodash-es': ['utility'], ramda: ['utility'],
    underscore: ['utility'], 'just-*': ['utility'],
    // Logging
    winston: ['logger'], pino: ['logger'], bunyan: ['logger'],
    consola: ['logger'], loglevel: ['logger'],
    // Testing
    jest: ['test-runner'], vitest: ['test-runner'],
    jasmine: ['test-runner'], mocha: ['test-runner'],
    '@playwright/test': ['e2e'], cypress: ['e2e'], 'webdriverio': ['e2e'],
    // ORMs / DB
    prisma: ['orm'], '@prisma/client': ['orm'],
    typeorm: ['orm'], sequelize: ['orm'], knex: ['query-builder'],
    drizzle: ['orm'], mongoose: ['odm'],
    // Auth
    'next-auth': ['auth'], '@auth/core': ['auth'],
    passport: ['auth'], 'passport-*': ['auth'],
    'jsonwebtoken': ['auth', 'jwt'], jose: ['auth', 'jwt'],
};
// ─── Forbidden license list for commercial use ────────────────────────────────
const COPYLEFT_LICENSES = new Set([
    'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later',
    'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later',
]);
const WEAK_COPYLEFT = new Set(['LGPL-2.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EUPL-1.1']);
function categorizePkg(name) {
    if (CATEGORY_MAP[name])
        return CATEGORY_MAP[name];
    // Wildcard prefix matching (e.g. 'passport-*')
    for (const [pattern, cats] of Object.entries(CATEGORY_MAP)) {
        if (pattern.endsWith('-*') && name.startsWith(pattern.slice(0, -1)))
            return cats;
    }
    return [];
}
function scanImports(srcDir) {
    const stats = new Map();
    let files = [];
    try {
        const out = (0, child_process_1.execSync)('find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ' +
            '-not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*"', { cwd: srcDir, encoding: 'utf8', timeout: 15000 });
        files = out.trim().split('\n').filter(Boolean);
    }
    catch {
        return stats;
    }
    // Match: import ... from 'pkg', require('pkg'), import('pkg')
    const importRe = /(?:from|require|import)\s*\(\s*['"]([^'"./][^'"]*)['"]/g;
    for (const relFile of files) {
        let content = '';
        try {
            content = fs_1.default.readFileSync(path_1.default.join(srcDir, relFile.replace(/^\.\//, '')), 'utf8');
        }
        catch {
            continue;
        }
        const seen = new Set();
        let m;
        importRe.lastIndex = 0;
        while ((m = importRe.exec(content)) !== null) {
            // Normalise scoped + sub-path: '@tanstack/react-query/foo' → '@tanstack/react-query'
            const raw = m[1];
            const pkg = raw.startsWith('@')
                ? raw.split('/').slice(0, 2).join('/')
                : raw.split('/')[0];
            if (!pkg || seen.has(pkg))
                continue;
            seen.add(pkg);
            if (!stats.has(pkg))
                stats.set(pkg, { name: pkg, files: [], domains: [] });
            const stat = stats.get(pkg);
            stat.files.push(relFile);
            // Infer domain from path segment after src/
            const parts = relFile.replace(/^\.\//, '').split('/');
            const srcIdx = parts.indexOf('src');
            const domain = srcIdx >= 0 ? parts[srcIdx + 1] : parts[0];
            if (domain && !stat.domains.includes(domain))
                stat.domains.push(domain);
        }
    }
    return stats;
}
// ─── Layer fit check ─────────────────────────────────────────────────────────
const BACKEND_ONLY_PACKAGES = new Set([
    'mongoose', 'prisma', '@prisma/client', 'typeorm', 'sequelize', 'knex',
    'drizzle', 'pg', 'mysql2', 'sqlite3', 'redis', 'ioredis', 'express',
    'fastify', 'koa', 'hapi', '@hapi/hapi', 'nest', '@nestjs/core',
    'socket.io', 'nodemailer', 'multer', 'busboy',
]);
const FRONTEND_LAYERS = new Set([
    'components', 'pages', 'views', 'ui', 'presentation', 'screens', 'app',
]);
function checkLayerFit(name, importStats) {
    if (!BACKEND_ONLY_PACKAGES.has(name))
        return { violation: false, reason: '' };
    // Check if similar backend packages are imported from frontend layers
    for (const [, stat] of importStats) {
        if (!BACKEND_ONLY_PACKAGES.has(stat.name))
            continue;
        for (const domain of stat.domains) {
            if (FRONTEND_LAYERS.has(domain)) {
                return {
                    violation: true,
                    reason: `${name} is a server-side package but your project imports similar packages (${stat.name}) from the "${domain}" layer.`,
                };
            }
        }
    }
    return { violation: false, reason: '' };
}
// ─── License check ───────────────────────────────────────────────────────────
function checkLicense(license) {
    if (COPYLEFT_LICENSES.has(license)) {
        return { ok: false, reason: `${license} is a strong copyleft license. Commercial use requires your project to also be open-source under ${license}.` };
    }
    if (WEAK_COPYLEFT.has(license)) {
        return { ok: true, reason: `${license} is a weak copyleft license. Review whether modifications to this library must be shared.` };
    }
    if (!license || license === 'UNKNOWN') {
        return { ok: false, reason: 'License is unknown. Check package source before using in a commercial project.' };
    }
    return { ok: true, reason: '' };
}
// ─── Main export ─────────────────────────────────────────────────────────────
function analyzeProject(packageName, license, projectRoot) {
    const importStats = scanImports(projectRoot);
    const targetCategories = categorizePkg(packageName);
    // Duplicate detection
    const duplicates = [];
    if (targetCategories.length > 0) {
        for (const [installedPkg, stat] of importStats) {
            if (installedPkg === packageName)
                continue;
            const installedCats = categorizePkg(installedPkg);
            const overlap = targetCategories.filter(c => installedCats.includes(c));
            if (overlap.length > 0) {
                duplicates.push({
                    name: installedPkg,
                    category: overlap[0],
                    fileCount: stat.files.length,
                    importCount: stat.files.length,
                    domains: stat.domains,
                });
            }
        }
    }
    // Layer fit
    const { violation: layerViolation, reason: layerViolationReason } = checkLayerFit(packageName, importStats);
    // License
    const { ok: licenseOk, reason: licenseReason } = checkLicense(license);
    // Already installed?
    const existingStat = importStats.get(packageName);
    let currentVersion = null;
    let installedVersion = null;
    try {
        const pkgJson = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectRoot, 'package.json'), 'utf8'));
        const allDeps = {
            ...(pkgJson.dependencies ?? {}),
            ...(pkgJson.devDependencies ?? {}),
        };
        currentVersion = allDeps[packageName] ?? null;
    }
    catch { /* ignore */ }
    try {
        const nmPkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectRoot, 'node_modules', packageName, 'package.json'), 'utf8'));
        installedVersion = nmPkg['version'] ?? null;
    }
    catch { /* not installed */ }
    const usageFiles = existingStat?.files ?? [];
    return {
        duplicates,
        layerViolation,
        layerViolationReason,
        licenseOk,
        licenseReason,
        alreadyInstalled: !!existingStat || currentVersion !== null,
        currentVersion,
        installedVersion,
        usageFiles,
    };
}
// ─── Scan all installed deps for duplicates ──────────────────────────────────
function findAllDuplicates(projectRoot) {
    const importStats = scanImports(projectRoot);
    // Group installed packages by category
    const byCategory = new Map();
    for (const [pkg, stat] of importStats) {
        for (const cat of categorizePkg(pkg)) {
            if (!byCategory.has(cat))
                byCategory.set(cat, []);
            byCategory.get(cat).push({
                name: pkg,
                category: cat,
                fileCount: stat.files.length,
                importCount: stat.files.length,
                domains: stat.domains,
            });
        }
    }
    return [...byCategory.entries()]
        .filter(([, pkgs]) => pkgs.length > 1)
        .map(([category, packages]) => ({ category, packages }))
        .sort((a, b) => b.packages.length - a.packages.length);
}
//# sourceMappingURL=analyzer.js.map