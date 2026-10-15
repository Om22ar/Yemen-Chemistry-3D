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
 * Formats raw LaTeX fractions \frac{num}{den} into accessible HTML visual fractions
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
      <span class="border-b border-indigo-400 pb-1 px-1.5 font-bold">${cleanNum}</span>
      <span class="pt-1 px-1.5 font-bold">${cleanDen}</span>
    </span>`;
  });

  return cleanFormulaText(html);
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
              <span class="pt-0.5 px-1 font-bold text-xs sm:text-sm">Δt (الزمن)</span>
            </div>
          </div>

          <span class="text-slate-400 text-lg">=</span>

          <!-- Products Term (Positive) -->
          <div class="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200">
            <span class="text-lg font-black">+</span>
            <div class="inline-flex flex-col items-center justify-center text-center leading-tight">
              <span class="border-b-2 border-emerald-400 pb-0.5 px-1 font-bold text-xs sm:text-sm">Δ[النواتج Products]</span>
              <span class="pt-0.5 px-1 font-bold text-xs sm:text-sm">Δt (الزمن)</span>
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
  if (rawFormula.includes('K_c') || rawFormula.includes('Kc')) {
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
          <span class="text-indigo-700 font-bold">💡 تنبيه منهجي:</span> المواد الصلبة النقية (s) والسوائل النقية (l) تراكيزها ثابتة وتُحذف من تعبير Kc.
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

  // 4. pH and pOH
  if (rawFormula.includes('pH') || rawFormula.includes('pOH')) {
    const formattedMath = formatMathHtml(rawFormula);
    return `
      <div class="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/40 border border-sky-200 shadow-2xs text-right">
        <div class="text-xs font-bold text-sky-950 mb-1.5 flex items-center justify-between">
          <span class="flex items-center gap-1"><span>🧪</span><span>قانون الأس الهيدروجيني (pH)</span></span>
          <span class="text-[11px] font-bold text-sky-700">مقياس سورنسن اللوغاريتمي</span>
        </div>
        <div class="p-2.5 bg-white rounded-xl border border-sky-200 text-center font-mono font-bold text-sm sm:text-base text-sky-900 dir-ltr my-1 shadow-2xs">
          ${formattedMath}
        </div>
        <p class="text-xs text-slate-600 mt-1.5">
          الرقم الهيدروجيني = اللوغاريتم السالب للأساس 10 لتركيز أيون الهيدروجين المولي في المحلول.
        </p>
      </div>
    `;
  }

  // 5. Standard fallback with clean formatting and badge
  const cleanedMath = formatMathHtml(rawFormula);
  return `
    <div class="mt-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-right shadow-2xs">
      <div class="p-2 bg-white rounded-lg border border-indigo-100 text-center font-mono font-bold text-xs sm:text-sm text-indigo-800 dir-ltr">
        ${cleanedMath}
      </div>
    </div>
  `;
}
