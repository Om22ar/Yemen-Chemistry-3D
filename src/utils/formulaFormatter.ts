/**
 * Chemistry & Mathematical Formula Formatter
 * Formats chemical formulas, reaction equations, and mathematical laws
 * into clear, pedagogical, student-friendly visual representations for Grade 11/12 students.
 */

export function cleanFormulaText(formula: string): string {
  if (!formula) return '';

  let cleaned = formula
    .replace(/\\\\/g, '\\')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\to/g, '→')
    .replace(/\\rightleftharpoons/g, '⇌')
    .replace(/\\implies/g, ' ⟹ ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\times/g, ' × ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\log/g, 'log')
    .replace(/\\quad/g, ' ')
    .replace(/\\left\s*[\(\[\{]/g, '(')
    .replace(/\\right\s*[\)\]\}]/g, ')')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\circ/g, '°');

  // Convert common subscripts and superscripts in simple text
  cleaned = cleaned
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^\+/g, '⁺')
    .replace(/\^-/g, '⁻')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃')
    .replace(/_4/g, '₄');

  return cleaned;
}

/**
 * Formats fractions and mathematical expressions into accessible HTML visual representations
 */
export function formatMathHtml(expr: string): string {
  if (!expr) return '';

  let html = expr;

  // Handle \frac{numerator}{denominator}
  const fracRegex = /\\frac\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g;
  html = html.replace(fracRegex, (_match, num, den) => {
    const cleanNum = cleanFormulaText(num);
    const cleanDen = cleanFormulaText(den);
    return `<span class="inline-flex flex-col items-center justify-center align-middle mx-1.5 text-center leading-none">
      <span class="border-b-2 border-indigo-400 pb-1 px-1.5 font-bold">${cleanNum}</span>
      <span class="pt-1 px-1.5 font-bold text-slate-700">${cleanDen}</span>
    </span>`;
  });

  // Handle square root symbols: √(expr)
  html = html.replace(
    /√\(([^)]+)\)/g,
    '<span class="inline-flex items-center gap-0.5"><span class="text-base font-bold">√</span><span class="border-t-2 border-slate-700 px-1 font-semibold">$1</span></span>'
  );

  return cleanFormulaText(html);
}

/**
 * Creates a clean fractional HTML block for student comprehension
 */
export function renderFraction(numerator: string, denominator: string, colorClass: string = 'border-indigo-400 text-indigo-900'): string {
  return `
    <span class="inline-flex flex-col items-center justify-center align-middle mx-1 text-center leading-tight dir-ltr">
      <span class="border-b-2 ${colorClass} pb-0.5 px-2 font-bold">${numerator}</span>
      <span class="pt-0.5 px-2 font-bold text-slate-700">${denominator}</span>
    </span>
  `;
}

/**
 * Formats a solution step by highlighting math equality, formulas, and fractions
 */
export function formatSolutionStep(step: string): string {
  if (!step) return '';

  // Clean math markers
  let formatted = formatMathHtml(step);

  // If contains equations like "X = Y = Z", wrap math tokens in clear badges
  if (formatted.includes('=') && !formatted.includes('<div') && !formatted.includes('<span class="bg-')) {
    formatted = formatted.replace(
      /([A-Za-z0-9_Δα\[\]\(\)\^·×\s\/\+\-]+=[A-Za-z0-9_Δα\[\]\(\)\^·×\s\/\+\-\.]+)/g,
      (match) => {
        return `<span class="bg-indigo-50 text-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200/80 font-mono font-bold inline-block my-0.5 dir-ltr shadow-2xs">${match}</span>`;
      }
    );
  }

  return formatted;
}

/**
 * Renders a full, pedagogical student-friendly card for chemical formulas
 * including verbal rule, clear mathematical fraction, signs explanation, and units.
 */
export function renderStudentFriendlyFormula(rawFormula: string, termName?: string): string {
  if (!rawFormula) return '';

  // 1. Special comprehensive formatting for Reaction Rate
  if (rawFormula.includes('Rate') || (termName && termName.includes('سرعة التفاعل'))) {
    return `
      <div class="mt-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-50 border border-indigo-200/90 shadow-2xs text-right">
        <!-- Header Info Tag -->
        <div class="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-indigo-100">
          <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
            <span>📐</span>
            <span>قانون سرعة التفاعل الكيميائي</span>
          </div>
          <span class="text-[11px] font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
            وحدة القياس: mol / (L · s)
          </span>
        </div>

        <!-- Visual Mathematical Formula (Fractional Layout) -->
        <div class="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base font-bold font-mono dir-ltr text-slate-800 my-1">
          <span class="text-sky-800 font-extrabold text-base sm:text-lg">Rate</span>
          <span class="text-slate-400 text-lg">=</span>
          
          <!-- Reactants Term (Negative) -->
          <div class="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50/80 px-2.5 py-1.5 rounded-xl border border-rose-200">
            <span class="text-lg font-black">-</span>
            <div class="inline-flex flex-col items-center justify-center text-center leading-tight">
              <span class="border-b-2 border-rose-400 pb-0.5 px-1 font-bold text-xs sm:text-sm">Δ[المتفاعلات Reactants]</span>
              <span class="pt-0.5 px-1 font-bold text-xs sm:text-sm text-slate-700">Δt (الزمن)</span>
            </div>
          </div>

          <span class="text-slate-400 text-lg">=</span>

          <!-- Products Term (Positive) -->
          <div class="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200">
            <span class="text-lg font-black">+</span>
            <div class="inline-flex flex-col items-center justify-center text-center leading-tight">
              <span class="border-b-2 border-emerald-400 pb-0.5 px-1 font-bold text-xs sm:text-sm">Δ[النواتج Products]</span>
              <span class="pt-0.5 px-1 font-bold text-xs sm:text-sm text-slate-700">Δt (الزمن)</span>
            </div>
          </div>
        </div>

        <!-- Student Readability Explanations -->
        <div class="mt-2.5 pt-2 border-t border-indigo-100/80 space-y-1.5 text-xs leading-relaxed">
          <div class="flex items-start gap-2 text-slate-800 font-medium">
            <span class="text-indigo-600 font-bold shrink-0">📖 الصيغة المنهجية:</span>
            <span>سرعة التفاعل = مقدار التغير في تركيز المواد المتفاعلة أو الناتجة ÷ التغير في الزمن (Δt)</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60">
            <div class="flex items-center gap-1.5 text-rose-700 font-medium">
              <span>🔴</span>
              <span><strong>إشارة (-) :</strong> تعني أن تركيز المتفاعلات يتناقص مع مرور الزمن.</span>
            </div>
            <div class="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span>🟢</span>
              <span><strong>إشارة (+) :</strong> تعني أن تركيز النواتج يتزايد مع مرور الزمن.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Equilibrium Constant Kc
  if (rawFormula.includes('K_c') || rawFormula.includes('Kc') || rawFormula.includes('[C]^c') || rawFormula.includes('[C]ᶜ')) {
    return `
      <div class="mt-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-50 border border-indigo-200/90 shadow-2xs text-right">
        <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-indigo-100">
          <span class="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <span>⚖️</span>
            <span>تعبير ثابت الاتزان الكيميائي بدلالة التراكيز (Kc)</span>
          </span>
          <span class="text-[11px] font-semibold text-slate-500">قانون فعل الكتلة</span>
        </div>

        <div class="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base font-bold font-mono dir-ltr text-slate-800 my-1">
          <span class="text-indigo-800 font-extrabold text-base sm:text-lg">Kc</span>
          <span class="text-slate-400">=</span>
          <div class="inline-flex flex-col items-center justify-center text-center leading-tight bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span class="border-b-2 border-indigo-400 pb-1 px-2 font-bold text-emerald-800">[C]<sup>c</sup> · [D]<sup>d</sup>  (حاصل ضرب تراكيز النواتج)</span>
            <span class="pt-1 px-2 font-bold text-sky-800">[A]<sup>a</sup> · [B]<sup>b</sup>  (حاصل ضرب تراكيز المتفاعلات)</span>
          </div>
        </div>

        <div class="mt-2 pt-1.5 border-t border-indigo-100 text-xs text-slate-700">
          <span class="text-indigo-700 font-bold">💡 تنبيه منهجي:</span> المواد الصلبة النقية (s) والسوائل النقية (l) تراكيزها ثابتة وتُحذف دائماً من تعبير ثابت الاتزان Kc.
        </div>
      </div>
    `;
  }

  // 3. Activation Energy Ea
  if (rawFormula.includes('E_a') || rawFormula.includes('Ea')) {
    return `
      <div class="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-indigo-50/40 border border-amber-200 shadow-2xs text-right">
        <div class="text-xs font-bold text-amber-900 mb-1.5 flex items-center justify-between">
          <span class="flex items-center gap-1"><span>⚡</span><span>حساب طاقة التنشيط (Ea)</span></span>
          <span class="text-[11px] font-mono text-slate-600">الوحدة: kJ / mol</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-amber-200 text-center font-mono font-bold text-sm sm:text-base text-amber-900 dir-ltr my-1 shadow-2xs">
          E<sub>a</sub> = E<sub>المعقد المنشط (Activated)</sub> - E<sub>المتفاعلات (Reactants)</sub>
        </div>
        <p class="text-xs text-slate-600 mt-1.5">
          طاقة التنشيط = المحتوى الطاقي للمركب النشط الانتقالي ناقصاً طاقة المواد المتفاعلة.
        </p>
      </div>
    `;
  }

  // 4. Dynamic Equilibrium Rates equality
  if (rawFormula.includes('r_{forward}') || rawFormula.includes('r_{reverse}')) {
    return `
      <div class="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/40 border border-sky-200 shadow-2xs text-right">
        <div class="text-xs font-bold text-sky-950 mb-1 flex items-center justify-between">
          <span>⚖️ شرط الاتزان الديناميكي</span>
          <span class="text-[11px] text-sky-700">ثبوت التراكيز وتساوي السرعات</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-sky-200 text-center font-mono font-bold text-sm sm:text-base text-sky-900 dir-ltr my-1 shadow-2xs">
          r<sub>الأمامي (forward)</sub> = r<sub>العكسي (reverse)</sub>
        </div>
        <p class="text-xs text-slate-600 mt-1">
          عند الاتزان، تتساوى سرعة التفاعل الأمامي مع سرعة التفاعل العكسي تماماً مع استمرار حركة الجزيئات ديناميكياً.
        </p>
      </div>
    `;
  }

  // 5. pH and pOH
  if (rawFormula.includes('pH') || rawFormula.includes('pOH') || rawFormula.includes('K_w') || rawFormula.includes('Kw')) {
    const formattedMath = formatMathHtml(rawFormula);
    return `
      <div class="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/40 border border-sky-200 shadow-2xs text-right">
        <div class="text-xs font-bold text-sky-950 mb-1.5 flex items-center justify-between">
          <span class="flex items-center gap-1"><span>🧪</span><span>قانون الأس الهيدروجيني والحاصل الأيوني للماء</span></span>
          <span class="text-[11px] font-bold text-sky-700">عند 25° مئوية</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-sky-200 text-center font-mono font-bold text-sm sm:text-base text-sky-900 dir-ltr my-1 shadow-2xs">
          ${formattedMath}
        </div>
        <p class="text-xs text-slate-600 mt-1.5">
          الرقم الهيدروجيني (pH) = اللوغاريتم السالب للأساس 10 لتركيز أيون الهيدروجين المولي في المحلول المائي.
        </p>
      </div>
    `;
  }

  // 6. Standard fallback with clean formatting and badge
  const cleanedMath = formatMathHtml(rawFormula);
  return `
    <div class="mt-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-right shadow-2xs">
      <div class="p-2.5 bg-white rounded-lg border border-indigo-100 text-center font-mono font-bold text-xs sm:text-sm text-indigo-800 dir-ltr shadow-2xs">
        ${cleanedMath}
      </div>
    </div>
  `;
}

/**
 * Renders an enhanced, student-friendly card for Key Laws with pedagogical clarity,
 * structured mathematical fractions, and variable breakdowns.
 */
export function renderComprehensiveLawCard(law: {
  name: string;
  formula: string;
  description: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
}): string {
  // Specialized pedagogical visual layouts for curriculum laws:

  // 1. Ostwald's Dilution Law
  if (law.name.includes('أستفالد') || law.formula.includes('Ka')) {
    return `
      <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-indigo-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-indigo-100">
          <div class="font-bold text-sm text-indigo-950 flex items-center gap-2">
            <span>📐</span>
            <span>${law.name}</span>
          </div>
          <span class="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-100">
            قانون منهجي مقرر
          </span>
        </div>

        <!-- Visual Fractional Formula -->
        <div class="bg-white p-4 rounded-xl border border-indigo-200 text-center font-mono font-bold text-base sm:text-lg text-indigo-900 shadow-2xs dir-ltr flex items-center justify-center gap-3 flex-wrap">
          <span class="text-indigo-800 font-extrabold text-xl">Ka</span>
          <span class="text-slate-400">=</span>
          <div class="inline-flex flex-col items-center justify-center text-center leading-tight bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span class="border-b-2 border-indigo-400 pb-0.5 px-2 font-bold text-indigo-950">α² · C</span>
            <span class="pt-0.5 px-2 font-bold text-slate-700">1 - α</span>
          </div>
          <span class="text-slate-500 font-sans text-sm">≈</span>
          <span class="bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-200 font-bold">
            α² · C  <span class="text-xs text-slate-500 font-sans">(عندما تكون α ضئيلة جداً ≪ 1)</span>
          </span>
        </div>

        <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
          <span class="text-indigo-800 font-bold">📜 نص القانون: </span>
          <span>${law.description}</span>
        </div>

        ${renderVariablesGrid(law.variables)}
      </div>
    `;
  }

  // 2. Arrhenius Equation
  if (law.name.includes('أرينيوس') || law.formula.includes('k = A')) {
    return `
      <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border border-amber-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-amber-100">
          <div class="font-bold text-sm text-amber-950 flex items-center gap-2">
            <span>⚡</span>
            <span>${law.name}</span>
          </div>
          <span class="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
            تأثير الحرارة وطاقة التنشيط
          </span>
        </div>

        <!-- Arrhenius Formula with Exponential Fraction -->
        <div class="bg-white p-4 rounded-xl border border-amber-200 text-center font-mono font-bold text-base sm:text-lg text-amber-950 shadow-2xs dir-ltr flex items-center justify-center gap-2 flex-wrap">
          <span class="text-amber-800 font-extrabold text-xl">k</span>
          <span class="text-slate-400">=</span>
          <span class="text-slate-900 font-bold text-lg">A · e</span>
          <div class="inline-flex flex-col items-center justify-center text-center leading-tight -mt-4 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 text-xs text-rose-800 font-bold">
            <span class="border-b border-rose-300 pb-0.5 px-1">-E<sub>a</sub></span>
            <span class="pt-0.5 px-1">R · T</span>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
          <span class="text-amber-800 font-bold">📜 الشرح العلمي: </span>
          <span>${law.description}</span>
        </div>

        ${renderVariablesGrid(law.variables)}
      </div>
    `;
  }

  // 3. Henderson-Hasselbalch Equation
  if (law.name.includes('هندرسون') || law.formula.includes('pKa')) {
    return `
      <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50/40 border border-sky-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-sky-100">
          <div class="font-bold text-sm text-sky-950 flex items-center gap-2">
            <span>🧪</span>
            <span>${law.name}</span>
          </div>
          <span class="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-200">
            المحاليل المنظمة (Buffer)
          </span>
        </div>

        <!-- Visual Henderson Formula -->
        <div class="bg-white p-4 rounded-xl border border-sky-200 text-center font-mono font-bold text-base sm:text-lg text-sky-950 shadow-2xs dir-ltr flex items-center justify-center gap-2 flex-wrap">
          <span class="text-sky-800 font-extrabold text-xl">pH</span>
          <span class="text-slate-400">=</span>
          <span class="text-indigo-800 font-bold">pKa</span>
          <span class="text-slate-400">+</span>
          <span class="font-bold">log</span>
          <div class="inline-flex items-center gap-0.5 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
            <span class="text-lg font-normal">(</span>
            <div class="inline-flex flex-col items-center justify-center text-center leading-tight">
              <span class="border-b-2 border-sky-400 pb-0.5 px-1.5 font-bold text-emerald-800">[الـمـلـح Salt]</span>
              <span class="pt-0.5 px-1.5 font-bold text-rose-800">[الـحـمـض Acid]</span>
            </div>
            <span class="text-lg font-normal">)</span>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
          <span class="text-sky-800 font-bold">📜 نص القانون: </span>
          <span>${law.description}</span>
        </div>

        ${renderVariablesGrid(law.variables)}
      </div>
    `;
  }

  // 4. Titration Law (Ma · Va = Mb · Vb)
  if (law.name.includes('المعايرة') || law.formula.includes('Ma · Va')) {
    return `
      <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-emerald-100">
          <div class="font-bold text-sm text-emerald-950 flex items-center gap-2">
            <span>⚖️</span>
            <span>${law.name}</span>
          </div>
          <span class="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
            تفاعل التعادل التام
          </span>
        </div>

        <!-- Visual Titration Formula with Transformation -->
        <div class="bg-white p-4 rounded-xl border border-emerald-200 text-center font-mono font-bold text-base sm:text-lg text-emerald-950 shadow-2xs dir-ltr flex items-center justify-center gap-3 flex-wrap">
          <div class="bg-sky-50 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-xl">
            M<sub>حمض</sub> · V<sub>حمض</sub>
          </div>
          <span class="text-slate-400">=</span>
          <div class="bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-1.5 rounded-xl">
            M<sub>قاعدة</sub> · V<sub>قاعدة</sub>
          </div>
          <span class="text-slate-400">⟹</span>
          <div class="flex items-center gap-1.5 text-emerald-900">
            <span>M<sub>حمض</sub> =</span>
            <div class="inline-flex flex-col items-center justify-center text-center leading-tight">
              <span class="border-b-2 border-emerald-500 pb-0.5 px-2 font-bold text-sm">M<sub>b</sub> · V<sub>b</sub></span>
              <span class="pt-0.5 px-2 font-bold text-slate-700 text-sm">V<sub>a</sub></span>
            </div>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
          <span class="text-emerald-800 font-bold">📜 نص القانون: </span>
          <span>${law.description}</span>
        </div>

        ${renderVariablesGrid(law.variables)}
      </div>
    `;
  }

  // 5. Kp and Kc relationship
  if (law.name.includes('Kp') || law.formula.includes('Kp = Kc')) {
    return `
      <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-indigo-200 shadow-2xs space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-indigo-100">
          <div class="font-bold text-sm text-indigo-950 flex items-center gap-2">
            <span>📐</span>
            <span>${law.name}</span>
          </div>
          <span class="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-100">
            الأنظمة الغازية المتزنة
          </span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-indigo-200 text-center font-mono font-bold text-base sm:text-lg text-indigo-950 shadow-2xs dir-ltr flex items-center justify-center gap-2 flex-wrap">
          <span class="text-indigo-800 font-extrabold text-xl">Kp</span>
          <span class="text-slate-400">=</span>
          <span class="text-sky-800 font-bold">Kc</span>
          <span class="text-slate-400">·</span>
          <span>(R · T)<sup>Δn</sup></span>
        </div>

        <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
          <span class="text-indigo-800 font-bold">📜 الشرح: </span>
          <span>${law.description}</span>
        </div>

        ${renderVariablesGrid(law.variables)}
      </div>
    `;
  }

  // Standard fallback
  const formattedFormula = formatMathHtml(law.formula);

  return `
    <div class="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-indigo-100/90 shadow-2xs space-y-3">
      <!-- Law Title Header -->
      <div class="flex items-center justify-between pb-2 border-b border-indigo-100/70">
        <div class="font-bold text-sm text-indigo-950 flex items-center gap-2">
          <span>📐</span>
          <span>${law.name}</span>
        </div>
        <span class="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-100">
          قانون منهجي مقرر
        </span>
      </div>

      <!-- Main Visual Math Box -->
      <div class="bg-gradient-to-r from-sky-50/60 to-indigo-50/60 p-4 rounded-xl border border-indigo-200 text-center font-mono font-bold text-base sm:text-lg text-indigo-900 shadow-2xs dir-ltr">
        ${formattedFormula}
      </div>

      <!-- Verbal Pedagogical Description -->
      <div class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
        <span class="text-indigo-800 font-bold">📜 نص القانون: </span>
        <span>${law.description}</span>
      </div>

      <!-- Variables Explanation Grid -->
      ${renderVariablesGrid(law.variables)}
    </div>
  `;
}

function renderVariablesGrid(variables: { symbol: string; meaning: string; unit?: string }[]): string {
  if (!variables || variables.length === 0) return '';
  return `
    <div class="pt-1">
      <div class="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
        <span>🔍</span>
        <span>دلالات الرموز ووحدات القياس:</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        ${variables
          .map(
            (v) => `
          <div class="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
            <span class="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 shrink-0 text-xs">${v.symbol}</span>
            <span class="text-slate-700 flex-1 leading-snug">${v.meaning} ${v.unit ? `<span class="text-slate-400 font-mono text-[11px]">(${v.unit})</span>` : ''}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}
