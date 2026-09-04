# Isotope Bench

**한국어** · [English](#isotope-bench--english)

질량분석(mass spectrometry) 입문자를 위한 스펙트럼 판독 연습 도구입니다.
동위원소 분포를 실제로 계산해서 문제를 만들기 때문에, 미리 저장해 둔 문제은행이 아니라
매번 새로 생성된 스펙트럼을 읽게 됩니다.

HTML 파일 하나로 되어 있고 외부 라이브러리·네트워크·서버가 필요 없습니다.
`index.html`을 브라우저로 열면 그대로 동작합니다.
화면 오른쪽 위의 `English` 버튼으로 앱 전체를 영문으로 전환할 수 있습니다.

---

## 바로 쓰기

**방법 1 — 내려받아 열기**

```bash
git clone https://github.com/MGHong98/Isotope-Bench.git
cd Isotope-Bench
open index.html          # macOS
# xdg-open index.html    # Linux
# start index.html       # Windows
```

**방법 2 — GitHub Pages**

저장소 `Settings → Pages → Source: Deploy from a branch`에서 `main` 브랜치의 `/ (root)`를
지정하면 `https://mghong98.github.io/Isotope-Bench/` 로 바로 접속할 수 있습니다.
파일 이름이 `index.html`이므로 별도 설정은 필요 없습니다.

설치 과정이 없고 진행도는 브라우저 `localStorage`에만 저장되므로,
실습실 공용 PC나 인터넷이 막힌 환경에서도 그대로 쓸 수 있습니다.

---

## 무엇을 배우게 되는가

퀴즈는 네 가지 유형으로 나옵니다. 모두 계산으로 생성되며 정답 해설이 함께 붙습니다.

| 유형 | 묻는 것 | 예 |
|---|---|---|
| **기초** | 관측 m/z에서 중성 분자의 단일동위원소 질량 되돌리기 | `[M+H]⁺ 195.0877` → `194.0804` |
| **이온 폼** | 분자식과 관측 m/z를 보고 부가체(adduct) 알아내기 | `[M+Na]⁺`인가 `[M+K]⁺`인가 |
| **동위원소 패턴** | 세기 비만 보고 할로젠·황 조성 알아내기 | `100 : 64 : 10` → Cl 2개 |
| **중성 손실** | 전구 이온과 프래그먼트 간격에서 빠져나간 중성 분자 알아내기 | `Δ 18.0106` → H₂O |

오답 보기는 무작위가 아니라 **입문자가 실제로 저지르는 실수**로 만들어져 있습니다.
부가체를 빼지 않은 값, 빼야 할 것을 더한 값, 다른 부가체로 착각한 값 같은 것들입니다.
난이도 3 이상에서는 공칭질량이 같은 손실(예: C₂H₆ 30.0470 대 CH₂O 30.0106)을
일부러 함께 내서, 고분해능이 왜 필요한지 숫자로 겪게 합니다.

### 난이도

| 단계 | 범위 |
|---|---|
| 0 | 입문 — m/z가 무엇인가, 스펙트럼 읽는 법 |
| 1 | CHNO · `[M+H]⁺` `[M+Na]⁺` · H₂O, NH₃ 손실 |
| 2 | Cl, Br · `[M+K]⁺` `[M−H]⁻` · CO, C₂H₄ 손실 |
| 3 | S, P · 2Na 폼·폼에이트 · 동일 공칭질량 손실 |
| 4 | 혼합 알칼리 · 2가 이온 · C₂H₆ 대 CH₂O |
| 5 | F, I, Si · N₂, HBr, H₃PO₄ 손실 |

각 난이도에는 **브리핑**(왜 그렇게 되는가 · 실험대에서 · 기억할 숫자)이 붙어 있고,
문헌 출처가 미주로 달려 있습니다. 난이도 0과 5에는 기기·이온화 개론과
데이터 처리 소프트웨어를 다루는 **부록**이 추가로 들어 있습니다.

---

## 탭 구성

### 퀴즈
브리핑을 읽고 스펙트럼을 판독합니다. 채점하면 해설과 계산 과정이 나오고,
`피크 표 보기`로 m/z와 상대 세기를 숫자로 확인할 수 있습니다.

### 스펙트럼 실험실
두 가지 도구가 있습니다.

- **정방향** — 중성 분자식과 이온 폼을 넣으면 동위원소 분포를 계산해 스펙트럼으로 그립니다.
  괄호와 첨자를 지원합니다: `(CH3)2SO`, `C14H11Cl2NO2`
- **역방향** — 관측 m/z와 이온 폼, 허용 오차(ppm)를 넣으면 중성 분자식 후보를 찾습니다.
  불포화도(RDB)와 질소 규칙으로 걸러서 오차가 작은 순으로 보여 줍니다.

기본값은 다이클로페낙 `C14H11Cl2NO2`와 `[M−H]⁻`로 맞춰져 있어서,
정방향으로 계산한 294.0094를 그대로 역방향에 넣으면 원래 분자식이 1순위로 돌아옵니다.
왕복해 보면 두 방향이 같은 계산이라는 것이 눈에 들어옵니다.

### 기록
푼 문제 수, 정답률, 연속 정답, 그리고 **자주 틀리는 항목**을 태그별로 셉니다.
진행도는 JSON으로 내보내고 되돌릴 수 있어서, 실습 과제 제출이나 기기 이동에 쓸 수 있습니다.

### 정보
제작 정보와 무결성 확인. 제작 정보는 `Object.freeze`로 잠겨 있고,
그 값으로 계산한 SHA-256을 파일에 기록된 값과 대조해 보여 줍니다.
변조를 **막는** 장치가 아니라 **드러내는** 장치입니다.

---

## 계산 근거

- **동위원소 질량·존재비** — NIST Atomic Weights and Isotopic Compositions
  (`molmass 2026.8.15`에서 추출). 존재비가 0이 아닌 안정 동위원소만 담았습니다.
  지원 원소는 H, C, N, O, F, Na, Si, P, S, Cl, K, Br, I 13종입니다.
- **동위원소 분포** — 원소별 분포를 이진 거듭제곱으로 구한 뒤 다항식 컨볼루션으로 합칩니다.
  1 mDa 이내 피크는 병합하고 확률 10⁻⁹ 미만은 버립니다.
- **전하 보정** — 전자 질량 0.000548580을 전하 수만큼 반영합니다.
  그래서 `[M+H]⁺`는 M + 1.00783이 아니라 **M + 1.00728**입니다.
- **중성 손실** — 분자식 수준의 타당성(뺄 원자가 있는가)과 화합물별로 실제 관측되는
  손실 목록만 검사합니다. **실제 절단 경로와 항상 일치하지는 않습니다.**

### 한계

교육용 시뮬레이터입니다. 실제 스펙트럼에는 있지만 여기에는 없는 것들이 있습니다.

- 이온 억제, 검출기 포화, 질량 정확도 편차, 노이즈, 크로마토그래피 분리
- 이합체(`[2M+H]⁺`)와 다중 전하 계열 전체
- 조각화의 실제 메커니즘(전하 이동, 수소 재배열 등)

정량이나 실제 시료 동정에 쓰는 도구가 아닙니다.
숫자를 확인할 때는 기기 제조사 소프트웨어나 검증된 계산기와 대조해 주세요.

---

## 문제를 늘리려면

화합물, 부가체, 중성 손실, 패턴은 모두 파일 안의 배열 하나씩입니다.
해당 배열에 항목을 추가하면 문제 생성기가 자동으로 집어 갑니다.

```js
// COMPOUNDS — tier 는 등장하기 시작하는 난이도
{n:"카페인", e:"Caffeine", f:"C8H10N4O2", tier:1,
 prot:1, cat:1, losses:[]},
```

플래그는 그 화합물에 어떤 이온화가 화학적으로 성립하는지를 뜻합니다.

| 플래그 | 의미 |
|---|---|
| `prot` | 염기성 자리가 있어 양성자화됨 → `[M+H]⁺` |
| `deprot` | 산성 양성자가 있어 탈양성자화됨 → `[M−H]⁻` |
| `cat` | 알칼리 금속 양이온화 가능 → `[M+Na]⁺` `[M+K]⁺` |
| `anion` | 음이온 부가 가능 → `[M+Cl]⁻` `[M+HCOO]⁻` |
| `polyB` | 염기성 자리 둘 이상 → `[M+2H]²⁺` |
| `poly` | 산성 자리 둘 이상 → `[M−2H]²⁻` |

`losses`에는 그 화합물에서 **실제로 관측되는** 손실 id만 적습니다.
분자식만 맞으면 통과시키는 구조가 아니므로, 여기에 적지 않은 손실은 문제로 나오지 않습니다.

문제 문장과 화면 문구는 모두 국문·영문 한 쌍으로 되어 있습니다.
새 항목을 넣을 때 `P(ko, en)` 형태나 `T.ko` / `T.en` 양쪽을 함께 채워야
언어 전환이 깨지지 않습니다.

`정보` 탭의 제작 정보(`BUILD`)를 고치면 무결성 해시가 달라집니다.
`정보` 탭에 표시되는 `현재 해시`를 `BUILD_DIGEST` 상수에 옮겨 적어야 다시 `일치`로 표시됩니다.

---

## 브라우저 요구사항

ES2020(옵셔널 체이닝, `??`)과 `crypto.subtle`을 쓰는 최신 브라우저면 됩니다.
Chrome, Edge, Firefox, Safari 최신 버전에서 동작합니다.

`file://`로 열면 브라우저에 따라 `crypto.subtle`이 막혀 무결성 확인만 `계산할 수 없음`으로
표시될 수 있습니다. 퀴즈·실험실·기록은 모두 정상 동작합니다.
무결성 확인까지 보려면 GitHub Pages 등 `https://`로 접속하거나 로컬 서버를 쓰면 됩니다.

```bash
python3 -m http.server 8000    # → http://localhost:8000
```

---

## 라이선스 · 제작

- 라이선스: **CC BY-NC 4.0** (출처를 밝히면 자유롭게 쓰고 고칠 수 있습니다. 상업적 이용은 제외)
- 제작: 홍민기 (Mingi Hong), 이학 석사
- 문의: 이 저장소의 [Issues](https://github.com/MGHong98/Isotope-Bench/issues)

### 참고 자료

브리핑과 부록의 미주에 링크가 걸려 있습니다. 주요 출처는 다음과 같습니다.

- NIST Atomic Weights and Isotopic Compositions
- Waters — The Mass Spectrometry Primer
- Thermo Fisher Scientific — Ionization Source Technology Overview
- LCGC International — Tips for Electrospray Ionization LC–MS
- Spectroscopy Online — Mass Analyzers: An Overview of Several Designs
- SIRIUS / MetFrag / MS-FINDER 문서

<br>

---

<br>

# Isotope Bench — English

[한국어](#isotope-bench) · **English**

A spectrum-reading trainer for people starting out in mass spectrometry.
Every question is generated by actually computing an isotope distribution, so you
are not working through a saved question bank — you read a freshly built spectrum
each time.

It is a single HTML file with no external libraries, no network calls and no server.
Open `index.html` in a browser and it runs.
The `한국어` button in the top right switches the whole app to Korean.

---

## Getting started

**Option 1 — clone and open**

```bash
git clone https://github.com/MGHong98/Isotope-Bench.git
cd Isotope-Bench
open index.html          # macOS
# xdg-open index.html    # Linux
# start index.html       # Windows
```

**Option 2 — GitHub Pages**

Under `Settings → Pages → Source: Deploy from a branch`, pick the `main` branch and
`/ (root)`. The site is then served at `https://mghong98.github.io/Isotope-Bench/`.
The file is already named `index.html`, so nothing else needs configuring.

There is no install step and progress lives only in the browser's `localStorage`,
so it works on a shared teaching-lab PC or on a machine with no internet access.

---

## What it teaches

Questions come in four types. All of them are computed, and each comes with a worked
explanation once you answer.

| Type | What it asks | Example |
|---|---|---|
| **Basic** | Work back from an observed m/z to the neutral monoisotopic mass | `[M+H]⁺ 195.0877` → `194.0804` |
| **Adduct** | Identify the adduct from the formula and the observed m/z | `[M+Na]⁺` or `[M+K]⁺`? |
| **Isotope pattern** | Read the halogen/sulfur content from intensity ratios alone | `100 : 64 : 10` → 2 × Cl |
| **Neutral loss** | Name the neutral lost between precursor and fragment | `Δ 18.0106` → H₂O |

Distractors are not random. They are **the mistakes beginners actually make**: the
value with the adduct never subtracted, the value with the adduct added instead of
subtracted, the value from confusing one adduct for another. From level 3 up, losses
with the same nominal mass (C₂H₆ at 30.0470 vs CH₂O at 30.0106) are deliberately put
side by side, so you meet the case for high resolution as a number rather than a claim.

### Levels

| Level | Scope |
|---|---|
| 0 | Primer — what m/z is, how to read a spectrum |
| 1 | CHNO · `[M+H]⁺` `[M+Na]⁺` · H₂O, NH₃ losses |
| 2 | Cl, Br · `[M+K]⁺` `[M−H]⁻` · CO, C₂H₄ losses |
| 3 | S, P · di-sodium and formate · isobaric losses |
| 4 | Mixed alkali · doubly charged ions · C₂H₆ vs CH₂O |
| 5 | F, I, Si · N₂, HBr, H₃PO₄ losses |

Each level opens with a **briefing** (why it happens · at the bench · numbers to
remember) with literature sources in the endnotes. Levels 0 and 5 carry an extra
**appendix** covering instruments and ionization, and data-processing software.

---

## The tabs

### Quiz
Read the briefing, then read the spectrum. Answering reveals the explanation and the
arithmetic; `Show peak table` gives you m/z and relative intensity as numbers.

### Spectrum lab
Two tools.

- **Forward** — enter a neutral formula and an adduct, and it computes the isotope
  distribution and plots it. Parentheses and subscripts are supported:
  `(CH3)2SO`, `C14H11Cl2NO2`
- **Reverse** — enter an observed m/z, an adduct and a tolerance in ppm, and it
  searches for candidate neutral formulas, filtered by ring-and-double-bond
  equivalents (RDB) and the nitrogen rule, ranked by smallest error.

The defaults are set to diclofenac `C14H11Cl2NO2` with `[M−H]⁻`, so the 294.0094 the
forward tool computes returns the original formula as the top hit when you paste it
into the reverse tool. Running the round trip makes it visible that both directions
are the same calculation.

### Log
Counts questions answered, accuracy, current streak, and **which tags you get wrong
most often**. Progress exports to JSON and imports back, which is useful for handing
in lab coursework or moving between machines.

### About
Build information and an integrity check. The build information is locked with
`Object.freeze`, and the SHA-256 computed from it is compared against the value
recorded in the file. This makes tampering **visible**; it does not prevent it.

---

## Where the numbers come from

- **Isotope masses and abundances** — NIST Atomic Weights and Isotopic Compositions
  (extracted via `molmass 2026.8.15`). Only stable isotopes with non-zero abundance
  are included. The 13 supported elements are H, C, N, O, F, Na, Si, P, S, Cl, K, Br, I.
- **Isotope distribution** — each element's distribution is built by binary
  exponentiation, then combined by polynomial convolution. Peaks within 1 mDa are
  merged and probabilities below 10⁻⁹ are dropped.
- **Charge correction** — the electron mass, 0.000548580, is applied per unit charge.
  That is why `[M+H]⁺` is **M + 1.00728**, not M + 1.00783.
- **Neutral losses** — screened only for formula-level plausibility (are there enough
  atoms to remove?) against a per-compound list of losses that are actually observed.
  **They do not always match real cleavage pathways.**

### Limits

This is a teaching simulator. Things that are in a real spectrum but not here:

- Ion suppression, detector saturation, mass-accuracy drift, noise, chromatographic
  separation
- Dimers (`[2M+H]⁺`) and multiply-charged series in general
- The actual mechanisms of fragmentation (charge migration, hydrogen rearrangement)

It is not a tool for quantitation or for identifying real samples. Check any number
that matters against your instrument vendor's software or a validated calculator.

---

## Adding questions

Compounds, adducts, neutral losses and patterns are each one array in the file. Add an
entry to the relevant array and the question generator picks it up automatically.

```js
// COMPOUNDS — tier is the level at which it starts appearing
{n:"카페인", e:"Caffeine", f:"C8H10N4O2", tier:1,
 prot:1, cat:1, losses:[]},
```

The flags say which ionization is chemically available for that compound.

| Flag | Meaning |
|---|---|
| `prot` | Has a basic site, so it protonates → `[M+H]⁺` |
| `deprot` | Has an acidic proton, so it deprotonates → `[M−H]⁻` |
| `cat` | Can be cationized by an alkali metal → `[M+Na]⁺` `[M+K]⁺` |
| `anion` | Can add an anion → `[M+Cl]⁻` `[M+HCOO]⁻` |
| `polyB` | Two or more basic sites → `[M+2H]²⁺` |
| `poly` | Two or more acidic sites → `[M−2H]²⁻` |

`losses` lists only the loss ids **actually observed** for that compound. The generator
does not accept a loss just because the formula allows it, so a loss you leave out here
will never be asked.

Every question string and every piece of UI text exists as a Korean/English pair. When
adding an entry, fill in both sides — either as `P(ko, en)` or in both `T.ko` and
`T.en` — or the language toggle will break.

Editing the build information (`BUILD`) shown in the `About` tab changes the integrity
hash. Copy the `Computed hash` shown in that tab into the `BUILD_DIGEST` constant for
it to read `Match` again.

---

## Browser requirements

Any current browser with ES2020 (optional chaining, `??`) and `crypto.subtle`. It runs
on current Chrome, Edge, Firefox and Safari.

Opened over `file://`, some browsers block `crypto.subtle`, in which case only the
integrity check reads `not available`. Quiz, lab and log all work normally. To see the
integrity check too, serve it over `https://` (GitHub Pages, for instance) or run a
local server.

```bash
python3 -m http.server 8000    # → http://localhost:8000
```

---

## License and credits

- License: **CC BY-NC 4.0** — free to use and modify with attribution, non-commercial
- Author: Mingi Hong (홍민기), M.S.
- Contact: the [Issues](https://github.com/MGHong98/Isotope-Bench/issues) tab of this repository

### References

Links are in the endnotes of the briefings and appendices. The main sources are:

- NIST Atomic Weights and Isotopic Compositions
- Waters — The Mass Spectrometry Primer
- Thermo Fisher Scientific — Ionization Source Technology Overview
- LCGC International — Tips for Electrospray Ionization LC–MS
- Spectroscopy Online — Mass Analyzers: An Overview of Several Designs
- SIRIUS / MetFrag / MS-FINDER documentation
