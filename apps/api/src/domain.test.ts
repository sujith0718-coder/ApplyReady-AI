import test from 'node:test'; import assert from 'node:assert/strict'; import {readiness,deadlineRisk,normalizeNotice} from './domain.js';
test('critical missing evidence lowers readiness',()=>{const r=normalizeNotice('a notice'); assert.equal(readiness(r),39);}); test('critical outstanding work creates high risk',()=>assert.equal(deadlineRisk(normalizeNotice('a notice')),'high'));
