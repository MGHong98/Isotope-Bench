/*
 * Isotope Bench 회귀 스위트
 *
 * 앱이 파일 하나라, 문제 하나를 손대다 생성기가 조용히 깨져도
 * 화면에는 아무 오류가 뜨지 않는다. 여기서 잡으려는 것은 그런 종류다.
 * 실제로 한 번 나왔던 결함마다 대응하는 검사를 하나씩 두었다.
 *
 *   node test/sweep.mjs
 *   CHROMIUM_PATH=/경로/chrome node test/sweep.mjs   # 브라우저를 직접 지정할 때
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = pathToFileURL(join(ROOT, 'index.html')).href;

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

// 알려진 이온의 단일동위원소 m/z. 계산을 건드렸을 때 값이 흔들리면 여기서 걸린다.
const KNOWN = [
  ['C6H12O6',       'M-H',  179.0561, 'Glucose [M-H]-'],
  ['C8H10N4O2',     'M+H',  195.0877, 'Caffeine [M+H]+'],
  ['C14H11Cl2NO2',  'M-H',  294.0094, 'Diclofenac [M-H]-'],
  ['C14H11Cl2NO2',  'M+H',  296.0240, 'Diclofenac [M+H]+'],
  ['C9H8O4',        'M+Na', 203.0315, 'Aspirin [M+Na]+'],
  ['C10H16N5O13P3', 'M-H',  505.9885, 'ATP [M-H]-'],
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();

const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
page.on('console', m => {
  if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.type() + ': ' + m.text());
});

await page.goto(PAGE);
await page.waitForTimeout(300);

/* ── 1. 무결성 — BUILD 를 고치고 BUILD_DIGEST 를 안 고치면 여기서 걸린다 ── */
{
  const v = await page.evaluate(async () => ({
    recorded: BUILD_DIGEST, now: await buildHash(), repo: BUILD.repo, version: BUILD.version,
  }));
  check('무결성 해시가 BUILD 와 일치', v.now === null || v.now === v.recorded,
        v.now === null ? '이 환경에서는 계산 불가 — 건너뜀' : `기록 ${v.recorded.slice(0,12)} / 계산 ${String(v.now).slice(0,12)}`);
  check('BUILD.repo 가 비어 있지 않음', !!v.repo, v.repo || '(미기재)');
}

/* ── 2. 계산의 기준값 ── */
{
  const r = await page.evaluate(K => {
    const out = { masses: [], ratios: {}, sums: [] };
    for (const [f, ad, exp, name] of K) {
      const s = ionSpectrum(parseFormula(f), adductById(ad), 0.5);
      out.masses.push({ name, exp, got: +s[0].mz.toFixed(4) });
    }
    const rel = f => {
      const s = ionSpectrum(parseFormula(f), adductById('M+H'), 0.01), b = s[0].mz;
      return [0, 2, 4].map(k => {
        const q = s.find(x => Math.abs(x.mz - b - k * 1.0) < 0.6 + k * 0.02);
        return q ? +q.rel.toFixed(0) : 0;
      });
    };
    out.ratios = { Cl1: rel('C6H5Cl'), Cl2: rel('C6H4Cl2'), Br1: rel('C6H5Br'), Br2: rel('C6H4Br2') };
    for (const f of ['C14H11Cl2NO2', 'C10H16N5O13P3', 'C8H24O4Si4'])
      out.sums.push(isotopeDistribution(parseFormula(f)).reduce((a, x) => a + x.p, 0));
    return out;
  }, KNOWN);

  for (const m of r.masses)
    check(`질량 ${m.name}`, Math.abs(m.got - m.exp) < 0.0002, `${m.got} (기대 ${m.exp})`);
  // 이론값: Cl 100:32 · Cl2 100:65:10 · Br 100:97 · Br2 51:100:49 (=1:2:1)
  check('Cl 세기비',  Math.abs(r.ratios.Cl1[1] - 32) <= 1, r.ratios.Cl1.join(':'));
  check('Cl₂ 세기비', Math.abs(r.ratios.Cl2[1] - 65) <= 2 && Math.abs(r.ratios.Cl2[2] - 10) <= 1, r.ratios.Cl2.join(':'));
  check('Br 세기비',  Math.abs(r.ratios.Br1[1] - 97) <= 1, r.ratios.Br1.join(':'));
  check('Br₂ 세기비 1:2:1', Math.abs(r.ratios.Br2[0] - 51) <= 2 && Math.abs(r.ratios.Br2[2] - 49) <= 2, r.ratios.Br2.join(':'));
  check('분포 확률 총합 ≈ 1', r.sums.every(s => Math.abs(s - 1) < 1e-6), r.sums.map(s => s.toFixed(9)).join(' '));
}

/* ── 3. 생성기 불변식 + 실제로 나왔던 결함들 ── */
{
  const r = await page.evaluate(() => {
    const bad = [], makers = { makeBasicQuestion, makeAdductQuestion, makePatternQuestion, makeLossQuestion };
    for (let lv = 0; lv <= 5; lv++) {
      for (let i = 0; i < 700; i++) {
        for (const name in makers) {
          let q;
          try { q = makers[name](lv); } catch (e) { bad.push(`${lv}/${name} 예외: ${e.message}`); continue; }
          if (!q) continue;                                  // 그 난이도에 재료가 없으면 null
          const ids = q.options.map(o => o.id);
          if (!ids.includes(q.answer))       bad.push(`${lv}/${name} 정답이 보기에 없음`);
          if (new Set(ids).size !== ids.length) bad.push(`${lv}/${name} 보기 중복`);
          if (ids.length < 2)                bad.push(`${lv}/${name} 보기 2개 미만`);
          if (!q.peaks || !q.peaks.length)   bad.push(`${lv}/${name} 피크 없음`);
          if (!tx(q.prompt))                 bad.push(`${lv}/${name} 문제 문장 비어 있음`);
          // 음이온 모드에서 "− -1.0073" 처럼 부호가 겹쳐 보이면 안 된다
          if (/[−-]\s+-/.test(tx(q.reveal))) bad.push(`${lv}/${name} 해설 부호 겹침: ${tx(q.reveal)}`);
        }
      }
    }
    return [...new Set(bad)];
  });
  check('생성기 불변식 (난이도 0–5 × 2800회)', r.length === 0, r.slice(0, 5).join(' | '));
}

/* ── 4. 패턴 문제의 부가체가 스스로 M+2 를 만들지 않는가 ──
       ⁴¹K 는 ³⁹K 대비 7.2%. [M+K]⁺ 를 쓰면 할로젠이 없는 분자도 M+2 가 7% 넘게 서서
       올바로 읽은 답이 오답 처리된다. 실제로 있었던 결함이다. */
{
  const r = await page.evaluate(() => {
    const seen = new Set(), offenders = [];
    for (let lv = 1; lv <= 5; lv++)
      for (let i = 0; i < 1200; i++) {
        const q = makePatternQuestion(lv);
        if (!q) continue;
        const m = tx(q.reveal).match(/\[[^\]]+\][⁺⁻]/);
        if (m) seen.add(m[0]);
      }
    for (const ad of ADDUCTS) if (addsOwnM2(ad)) offenders.push(ad.id);
    return { used: [...seen], flagged: offenders };
  });
  const K = r.used.filter(l => /\bK\b|K\]/.test(l));
  check('패턴 문제에 M+2 를 만드는 부가체가 없음', K.length === 0,
        `사용된 부가체: ${r.used.join(' ')} · 차단 대상: ${r.flagged.join(',')}`);
}

/* ── 5. 난이도 라벨이 실제로 나오는 것만 약속하는가 ──
       낼 수 없는 대조를 라벨이 광고하고 있던 적이 있다. */
{
  const r = await page.evaluate(() => {
    const seen = {};
    for (const lv of [2, 3, 4, 5]) {
      const pat = new Set(), add = new Set(), loss = new Set();
      for (let i = 0; i < 2500; i++) {
        let q;
        if ((q = makePatternQuestion(lv))) pat.add(q.answer);
        if ((q = makeAdductQuestion(lv)))  add.add(q.answer);
        if ((q = makeLossQuestion(lv)))    loss.add(q.answer);
      }
      seen[lv] = { pat: [...pat], add: [...add], loss: [...loss] };
    }
    return {
      'lv4 Br+Cl 혼합 패턴': seen[4].pat.includes('BrCl'),
      'lv4 2가 양이온':      seen[4].add.some(a => adductById(a).z === 2),
      'lv4 혼합 알칼리':     seen[4].add.some(a => /Na\+K/.test(a)),
      'lv5 2가 음이온':      seen[5].add.some(a => adductById(a).z === -2),
      'lv5 H₃PO₄ 손실':     seen[5].loss.includes('H3PO4'),
      'lv3 동일 공칭질량 짝': seen[3].loss.includes('CO'),
    };
  });
  for (const [k, v] of Object.entries(r)) check(`난이도 라벨: ${k}`, v);
}

/* ── 6. 1 mDa 안의 두 피크가 표에 두 줄로 남지 않는가 ── */
{
  const r = await page.evaluate(() => {
    const bad = [];
    for (const cmp of COMPOUNDS) for (const ad of ADDUCTS) {
      if (!adductOK(cmp, ad)) continue;
      const s = ionSpectrum(parseFormula(cmp.f), ad, 0.5);
      if (!s) continue;
      for (let i = 1; i < s.length; i++) {
        const d = (s[i].mz - s[i-1].mz) * Math.abs(ad.z);
        if (d > 0 && d < 0.001) bad.push(`${cmp.e}/${ad.id} ${(d*1000).toFixed(3)}mDa`);
      }
    }
    return bad;
  });
  check('1 mDa 미만으로 갈라진 피크 없음', r.length === 0, r.slice(0, 3).join(' '));
}

/* ── 7. i18n — 한쪽 언어만 채우면 전환이 깨진다 ── */
{
  const r = await page.evaluate(() => {
    const ko = Object.keys(T.ko), en = Object.keys(T.en);
    const used = [...document.querySelectorAll('[data-i18n]')].map(e => e.dataset.i18n);
    const lv = [0,1,2,3,4,5];
    const marks = o => o == null ? [] :
      [...new Set([...JSON.stringify(o).matchAll(/\[\^(\d+)\]/g)].map(m => +m[1]))];
    const noteGaps = [];
    for (const l of lv) {
      for (const [tag, body, notes] of [
        ['brief', BRIEFINGS_KO[l], BRIEF_NOTES[l]], ['brief-en', BRIEFINGS_EN[l], BRIEF_NOTES[l]],
        ['appx',  APPENDIX_KO[l],  APPX_NOTES[l]],  ['appx-en',  APPENDIX_EN[l],  APPX_NOTES[l]],
      ]) {
        const m = marks(body), have = (notes || []).length;
        if (m.length && Math.max(...m) > have) noteGaps.push(`lv${l} ${tag}: [^${Math.max(...m)}] 인데 출처 ${have}개`);
      }
      // 두 언어의 브리핑·부록이 같은 모양인가
      if (!!BRIEFINGS_KO[l] !== !!BRIEFINGS_EN[l]) noteGaps.push(`lv${l} 브리핑이 한 언어에만 있음`);
      if (!!APPENDIX_KO[l]  !== !!APPENDIX_EN[l])  noteGaps.push(`lv${l} 부록이 한 언어에만 있음`);
    }
    return {
      onlyKo: ko.filter(k => !en.includes(k)),
      onlyEn: en.filter(k => !ko.includes(k)),
      unresolved: used.filter(k => !(k in T.ko) || !(k in T.en)),
      noteGaps,
      levels: LEVELS.map(l => l.v).filter(v => !BRIEFINGS_KO[v] || !BRIEFINGS_EN[v]),
    };
  });
  check('T.ko / T.en 키가 짝을 이룸', r.onlyKo.length === 0 && r.onlyEn.length === 0,
        `ko만 ${r.onlyKo.join(',')} · en만 ${r.onlyEn.join(',')}`);
  check('data-i18n 이 모두 해석됨', r.unresolved.length === 0, r.unresolved.join(','));
  check('미주 번호마다 출처가 있음', r.noteGaps.length === 0, r.noteGaps.join(' | '));
  check('모든 난이도에 브리핑이 있음', r.levels.length === 0, `누락 ${r.levels.join(',')}`);
}

/* ── 8. 화면 조작 — 전 난이도 × 두 언어로 실제로 풀어 본다 ── */
{
  let uiBad = [];
  for (const lang of ['ko', 'en']) {
    if (lang === 'en') await page.click('#lang-toggle');
    for (let lv = 0; lv <= 5; lv++) {
      await page.selectOption('#level', String(lv));
      await page.click('#tab-quiz');
      for (let i = 0; i < 12; i++) {
        if (await page.locator('#q-opts button').count() === 0) uiBad.push(`${lang}/lv${lv} 보기 없음`);
        if (!(await page.locator('#q-prompt').innerText()).trim()) uiBad.push(`${lang}/lv${lv} 문제 비어 있음`);
        await page.locator('#q-opts button').first().click();
        if (!(await page.locator('#q-verdict').innerText()).trim()) uiBad.push(`${lang}/lv${lv} 채점 결과 없음`);
        await page.click('#q-next');
      }
    }
  }
  await page.click('#lang-toggle');   // ko 로 복귀
  check('화면 조작 (6난이도 × 2언어 × 12문제)', uiBad.length === 0, [...new Set(uiBad)].slice(0, 3).join(' | '));
}

/* ── 9. 실험실과 역산기 ── */
{
  await page.click('#tab-lab');
  let labBad = [];
  for (const f of ['C14H11Cl2NO2', '(CH3)2SO', 'C6H5Cl', '', 'C0', 'Xx2', 'C1000H1000']) {
    await page.fill('#l-formula', f);
    await page.click('#l-run');
    await page.waitForTimeout(40);
    const out = await page.locator('#l-out').innerText();
    if (/NaN|undefined|\[object/.test(out)) labBad.push(`실험실 "${f}" → ${out.slice(0, 60)}`);
  }
  await page.fill('#l-formula', 'C14H11Cl2NO2');
  for (const ad of ['M-H', 'M+H', 'M+H-H2O', 'M+2Na-H', 'M+2H', 'M-2H']) {
    await page.selectOption('#f-adduct', ad);
    await page.fill('#f-mz', '294.0094');
    await page.fill('#f-ppm', '5');
    await page.click('#f-run');
    await page.waitForTimeout(250);
    const out = await page.locator('#f-out').innerText();
    if (/NaN|undefined/.test(out)) labBad.push(`역산기 ${ad} → NaN`);
    // NaN 만 보면 부족하다. monoisotopicMass(null) 은 0 을 돌려주므로, 만들 수 없는
    // 이온이 걸러지지 않으면 NaN 이 아니라 그럴듯한 숫자가 찍힌다. 값의 범위로 잡는다.
    for (const line of out.split('\n')) {
      const m = line.trim().match(/^([A-Z][A-Za-z0-9]*)\t\s*(-?[\d.]+)\t\s*(-?[\d.]+)/);
      if (!m) continue;
      const calc = parseFloat(m[2]), ppm = parseFloat(m[3]);
      if (!(calc > 0) || Math.abs(calc - 294.0094) > 1)  labBad.push(`역산기 ${ad} 계산 m/z 이상: ${m[1]} ${calc}`);
      if (!Number.isFinite(ppm) || Math.abs(ppm) > 20)   labBad.push(`역산기 ${ad} ppm 이상: ${m[1]} ${ppm}`);
    }
  }
  check('실험실·역산기 출력값이 정상 범위', labBad.length === 0, labBad.slice(0, 3).join(' | '));

  // 왕복: 정방향으로 낸 m/z 를 역방향에 넣으면 원래 분자식이 1순위로 돌아와야 한다
  await page.selectOption('#f-adduct', 'M-H');
  await page.fill('#f-mz', '294.0094');
  await page.click('#f-run');
  await page.waitForTimeout(300);
  const rows = (await page.locator('#f-out').innerText()).split('\n').map(l => l.trim());
  const rank = rows.findIndex(l => l.startsWith('C14H11Cl2NO2'));
  check('역산 왕복이 원래 분자식을 1순위로 되돌림', rank > 0 && rank <= 3, `표에서 ${rank}번째 줄`);
}

/* ── 10. 기록 지우기 뒤 화면과 세이브가 어긋나지 않는가 ── */
{
  await page.click('#lang-toggle');                 // en
  await page.selectOption('#level', '4');
  await page.click('#tab-quiz');
  // 브리핑을 접으면 "읽은 것으로" 표시된다. 기록을 지우면 그 표시도 지워지므로
  // 화면이 다시 그려져야 브리핑이 펼쳐진다. 세이브만 갈아끼우면 접힌 채로 남는다.
  if (await page.getAttribute('#brief-toggle', 'aria-expanded') === 'true')
    await page.click('#brief-toggle');
  await page.locator('#q-opts button').first().click();   // 통계를 0 이 아니게 만든다
  await page.click('#tab-log');
  await page.click('#e-reset');
  await page.waitForTimeout(250);
  const st = await page.evaluate(() => ({
    lang: LANG, saveLang: save.lang, level: save.level,
    select: document.getElementById('level').value, total: save.total,
    briefed: JSON.stringify(save.briefed),
    briefOpen: document.getElementById('brief-toggle').getAttribute('aria-expanded'),
  }));
  check('기록 지우기 뒤 화면과 세이브가 일치',
        st.lang === st.saveLang && String(st.level) === st.select && st.total === 0,
        JSON.stringify(st));
  check('기록 지우기가 화면을 다시 그림', st.briefed === '{}' && st.briefOpen === 'true',
        `briefed ${st.briefed} · 브리핑 펼침 ${st.briefOpen}`);
}

/* ── 11. 콘솔 ── */
check('콘솔 오류 없음', consoleErrors.length === 0, [...new Set(consoleErrors)].slice(0, 3).join(' | '));

await browser.close();

/* ── 보고 ── */
const failed = results.filter(r => !r.ok);
for (const r of results)
  console.log(`${r.ok ? ' ok ' : 'FAIL'}  ${r.name}${r.detail ? `\n        ${r.detail}` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
if (failed.length) {
  console.log(`\n실패 ${failed.length}건:`);
  for (const r of failed) console.log(`  - ${r.name}: ${r.detail}`);
  process.exit(1);
}
