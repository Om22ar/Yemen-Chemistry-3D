// Chemistry Calculator Service - Exact Chemical Mathematics and Step-by-Step Breakdown

export interface CalculationResult {
  result: number | string | boolean;
  formula: string;
  explanation: string;
  stepByStep: string[];
  unit?: string;
  atomCounts?: {
    left: Record<string, number>;
    right: Record<string, number>;
  };
}

export class ChemistryCalculator {
  // 1. pH Calculation
  static calculatePH(hydrogenConcentration: number): CalculationResult {
    if (hydrogenConcentration <= 0) {
      throw new Error('تركيز أيون الهيدروجين يجب أن يكون قيمة موجبة أكبر من الصفر');
    }
    const ph = -Math.log10(hydrogenConcentration);
    const rounded = parseFloat(ph.toFixed(3));
    const poh = parseFloat((14 - rounded).toFixed(3));
    const nature = rounded < 6.8 ? 'حمضي (Acidic)' : rounded > 7.2 ? 'قاعدي (Basic)' : 'متعادل (Neutral)';

    return {
      result: rounded,
      unit: '',
      formula: 'pH = -\\log[H^+]',
      explanation: `المحلول ذو طبيعة: ${nature} عند 25°م. تركيز أيونات الهيدروجين هو ${hydrogenConcentration} مول/لتر.`,
      stepByStep: [
        'تطبيق القانون الرياضي: pH = -log[H⁺]',
        `التعويض المباشر بالتركيز: pH = -log(${hydrogenConcentration})`,
        `قيمة اللوغاريتم: log(${hydrogenConcentration}) = ${Math.log10(hydrogenConcentration).toFixed(4)}`,
        `الناتج النهائي: pH = -(${Math.log10(hydrogenConcentration).toFixed(4)}) = ${rounded}`,
        `قيمة pOH المرافقة عند 25°م: pOH = 14 - ${rounded} = ${poh}`,
      ],
    };
  }

  // 2. pOH Calculation
  static calculatePOH(hydroxideConcentration: number): CalculationResult {
    if (hydroxideConcentration <= 0) {
      throw new Error('تركيز أيون الهيدروكسيد يجب أن يكون قيمة موجبة أكبر من الصفر');
    }
    const poh = -Math.log10(hydroxideConcentration);
    const rounded = parseFloat(poh.toFixed(3));
    const ph = parseFloat((14 - rounded).toFixed(3));

    return {
      result: rounded,
      unit: '',
      formula: 'pOH = -\\log[OH^-]',
      explanation: `تركيز أيون الهيدروكسيد هو ${hydroxideConcentration} مول/لتر. وقيمة الرقم الهيدروجيني المقابلة هي pH = ${ph}.`,
      stepByStep: [
        'تطبيق القانون: pOH = -log[OH⁻]',
        `التعويض بالتركيز: pOH = -log(${hydroxideConcentration})`,
        `الناتج: pOH = ${rounded}`,
        `حساب الرقم الهيدروجيني المقابل: pH = 14 - pOH = 14 - ${rounded} = ${ph}`,
      ],
    };
  }

  // 3. Kw Autoionization Calculation
  static getKw(hConc: number, ohConc: number): CalculationResult {
    const kw = hConc * ohConc;
    return {
      result: kw.toExponential(2),
      unit: 'mol²/L²',
      formula: 'K_w = [H^+][OH^-]',
      explanation: 'الحاصل الأيوني للماء النقي أو أي محلول مائي عند 25°م يساوي دائماً 1.0 × 10⁻¹⁴.',
      stepByStep: [
        'تطبيق قانون التأين الذاتي للماء: Kw = [H⁺] × [OH⁻]',
        `التعويض: Kw = (${hConc}) × (${ohConc})`,
        `الناتج المحسوب: Kw = ${kw.toExponential(4)} مول²/لتر²`,
      ],
    };
  }

  // 4. Solution Dilution Formula (M1 * V1 = M2 * V2)
  static dilutionFormula(
    m1: number,
    v1Ml: number,
    m2: number
  ): CalculationResult {
    if (m2 <= 0) throw new Error('التركيز الجديد المطلوب M2 يجب أن يكون أكبر من الصفر');
    if (m1 <= 0 || v1Ml <= 0) throw new Error('التركيز والحجم الابتدائيان يجب أن يكونا قيماً موجبة');

    // V2 = (M1 * V1) / M2
    const v2Ml = (m1 * v1Ml) / m2;
    const waterToAddMl = v2Ml - v1Ml;

    return {
      result: parseFloat(v2Ml.toFixed(2)),
      unit: 'mL',
      formula: 'M_1 \\cdot V_1 = M_2 \\cdot V_2 \\implies V_2 = \\frac{M_1 \\cdot V_1}{M_2}',
      explanation: `الحجم النهائي المطلوب للمحلول المخفف هو ${v2Ml.toFixed(2)} mL.`,
      stepByStep: [
        'قانون تخفيف المحاليل: M₁ × V₁ = M₂ × V₂',
        `المعطيات: M₁ = ${m1} M, V₁ = ${v1Ml} mL, M₂ = ${m2} M`,
        `حساب الحجم الكلي النهائي: V₂ = (${m1} × ${v1Ml}) / ${m2}`,
        `V₂ = ${(m1 * v1Ml).toFixed(3)} / ${m2} = ${v2Ml.toFixed(2)} mL`,
        waterToAddMl > 0
          ? `حجم الماء المقطر الواجب إضافته للتخفيف: V₂ - V₁ = ${waterToAddMl.toFixed(2)} mL`
          : 'المحلول يحتاج إلى زيادة تركيز وليس تخفيفاً بالماء.',
      ],
    };
  }

  // 5. Mass of Solute Calculation: Mass = M * V_liters * MolarMass
  static calculateMass(
    molarity: number,
    volumeMl: number,
    molarMass: number
  ): CalculationResult {
    const vLiters = volumeMl / 1000;
    const moles = molarity * vLiters;
    const massGrams = moles * molarMass;

    return {
      result: parseFloat(massGrams.toFixed(3)),
      unit: 'g (جرام)',
      formula: 'm = M \\cdot V_{(L)} \\cdot M_w',
      explanation: `كتلة المادة الصلبة النقية المطلوبة لإعداد هذا المحلول هي ${massGrams.toFixed(3)} جرام.`,
      stepByStep: [
        'تحويل الحجم من المليلتر إلى اللتر: V = volume / 1000',
        `V = ${volumeMl} / 1000 = ${vLiters} L`,
        `حساب عدد المولات: n = M × V = ${molarity} × ${vLiters} = ${moles.toFixed(4)} mol`,
        `حساب الكتلة بالجرام: m = n × Mw = ${moles.toFixed(4)} × ${molarMass}`,
        `الكتلة المطلوبة: m = ${massGrams.toFixed(3)} جرام`,
      ],
    };
  }

  // 6. Titration Unknown Molarity
  static titrationCalculation(
    mStandard: number,
    vStandardMl: number,
    vUnknownMl: number,
    ratio: number = 1 // mole acid : mole base
  ): CalculationResult {
    if (vUnknownMl <= 0) throw new Error('حجم المحلول المجهول يجب أن يكون أكبر من الصفر');

    // M_unknown = (M_std * V_std) / (V_unknown * ratio)
    const mUnknown = (mStandard * vStandardMl) / (vUnknownMl * ratio);
    const rounded = parseFloat(mUnknown.toFixed(4));

    return {
      result: rounded,
      unit: 'M (مول/لتر)',
      formula: 'M_{\\text{unknown}} = \\frac{M_{\\text{std}} \\cdot V_{\\text{std}}}{V_{\\text{unknown}} \\cdot \\text{ratio}}',
      explanation: `تركيز المحلول المجهول المحسوب من تجربة المعايرة هو ${rounded} مول/لتر.`,
      stepByStep: [
        'قانون المعايرة والتكافؤ: (M₁ × V₁) / n₁ = (M₂ × V₂) / n₂',
        `المعطيات: M(قياسي) = ${mStandard} M, V(قياسي) = ${vStandardMl} mL, V(مجهول) = ${vUnknownMl} mL`,
        `النسبة المولية (ratio): ${ratio}`,
        `M(مجهول) = (${mStandard} × ${vStandardMl}) / (${vUnknownMl} × ${ratio})`,
        `M(مجهول) = ${(mStandard * vStandardMl).toFixed(3)} / ${(vUnknownMl * ratio).toFixed(3)} = ${rounded} M`,
      ],
    };
  }

  // 7. Weak Acid Ionization Constant (Ka) via Ostwald's Law
  static calculateKa(concentration: number, alpha: number): CalculationResult {
    if (alpha <= 0 || alpha >= 1) throw new Error('درجة التفكك α يجب أن تكون بين 0 و 1 (مثال: 0.013)');
    // Ka = (C * alpha^2) / (1 - alpha)
    const ka = (concentration * Math.pow(alpha, 2)) / (1 - alpha);
    const pka = -Math.log10(ka);

    return {
      result: ka.toExponential(3),
      unit: 'mol/L',
      formula: 'K_a = \\frac{\\alpha^2 \\cdot C}{1 - \\alpha}',
      explanation: `ثابت تأين الحمض الضعيف Ka = ${ka.toExponential(3)}، وقيمة pKa = ${pka.toFixed(2)}.`,
      stepByStep: [
        'تطبيق قانون أستفالد للتخفيف: Ka = (α² × C) / (1 - α)',
        `المعطيات: التركيز C = ${concentration} M، درجة التأين α = ${alpha}`,
        `حساب البسط: α² × C = (${alpha})² × ${concentration} = ${(Math.pow(alpha, 2) * concentration).toExponential(4)}`,
        `حساب المقام: 1 - α = 1 - ${alpha} = ${(1 - alpha).toFixed(4)}`,
        `Ka = ${ka.toExponential(4)} mol/L`,
        `pKa = -log(Ka) = ${pka.toFixed(2)}`,
      ],
    };
  }

  // 8. Chemical Equation Balancing Verifier
  static verifyEquationBalance(
    reactants: { formula: string; coefficient: number }[],
    products: { formula: string; coefficient: number }[]
  ): CalculationResult {
    const leftAtoms: Record<string, number> = {};
    const rightAtoms: Record<string, number> = {};

    for (const r of reactants) {
      const atoms = this.parseFormulaAtoms(r.formula);
      for (const [elem, count] of Object.entries(atoms)) {
        leftAtoms[elem] = (leftAtoms[elem] || 0) + count * r.coefficient;
      }
    }

    for (const p of products) {
      const atoms = this.parseFormulaAtoms(p.formula);
      for (const [elem, count] of Object.entries(atoms)) {
        rightAtoms[elem] = (rightAtoms[elem] || 0) + count * p.coefficient;
      }
    }

    // Compare
    const allElements = new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]);
    let isBalanced = true;
    const diffDetails: string[] = [];

    for (const elem of allElements) {
      const l = leftAtoms[elem] || 0;
      const r = rightAtoms[elem] || 0;
      if (l !== r) {
        isBalanced = false;
        diffDetails.push(`عنصر ${elem}: في المتفاعلات = ${l} ذرة، وفي النواتج = ${r} ذرة (غير متطابق!)`);
      } else {
        diffDetails.push(`عنصر ${elem}: ${l} ذرة في الطرفين (متوازن ✓)`);
      }
    }

    const eqStr =
      reactants.map((r) => `${r.coefficient > 1 ? r.coefficient : ''}${r.formula}`).join(' + ') +
      ' → ' +
      products.map((p) => `${p.coefficient > 1 ? p.coefficient : ''}${p.formula}`).join(' + ');

    return {
      result: isBalanced,
      formula: eqStr,
      explanation: isBalanced
        ? 'المعادلة الكيميائية موزونة تماماً، وعدد ذرات كل عنصر محفوظ على طرفي التفاعل وفق قانون بقاء المادة.'
        : 'المعادلة غير موزونة. عدد الذرات غير متساوٍ بين المتفاعلات والنواتج.',
      stepByStep: [
        `المعادلة المدخلة: ${eqStr}`,
        ...diffDetails,
        isBalanced
          ? 'النتيجة: المعادلة تحقق قانون بقاء الكتلة بنجاح ✓'
          : 'النتيجة: تحتاج المعادلة إلى تعديل المعاملات لموازنة الذرات ✗',
      ],
      atomCounts: {
        left: leftAtoms,
        right: rightAtoms,
      },
    };
  }

  // Simple formula parser for common chemical formulas: e.g. H2, O2, H2O, NH3, N2, HCl, NaOH, CaCO3, CO2
  private static parseFormulaAtoms(formula: string): Record<string, number> {
    const counts: Record<string, number> = {};
    const regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const elem = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      counts[elem] = (counts[elem] || 0) + count;
    }
    return counts;
  }
}
