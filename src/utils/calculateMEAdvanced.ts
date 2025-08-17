export type SpeciesAlg = 'dog' | 'cat';
export type AgeUnitAlg = 'years' | 'months' | 'weeks';
export type ActivityAlg = 'low' | 'moderate' | 'high' | 'obesity_prone';
export type StatusAlg = 'none' | 'preg_1_4' | 'preg_5_plus' | 'lactation';

export function calculateMEAlgorithm(params: {
  species: SpeciesAlg;
  age: number;
  ageUnit: AgeUnitAlg;
  weight: number;           // target weight (kg)
  bcs: number;              // 1..9
  activity: ActivityAlg;
  status: StatusAlg;
  adultWeight?: number;     // for puppies/kittens
  lactationWeek?: number;   // integer
  litterCount?: number;     // puppies/kittens count
}): number {
  const { species, age, ageUnit, weight, bcs, activity, status, adultWeight = 0, lactationWeek = 0, litterCount = 0 } = params;
  const pow = (x:number,p:number)=>Math.pow(x,p);
  const bcsMultipliers: Record<number, number> = {1:1.4,2:1.3,3:1.2,4:1.1,5:1.0,6:0.9,7:0.8,8:0.7,9:0.6};
  const oBW = weight * (bcsMultipliers[bcs] ?? 1.0);
  const ageWeeks = ageUnit === 'weeks' ? age : ageUnit === 'months' ? age * 4.3482 : age * 52;

  const dogLactWeekCoef = (w:number) => ({1:0.75,2:0.95,3:1.1,4:1.2} as any)[w] ?? 1.0;
  const catLactWeekCoef = (w:number) => ({1:0.9,2:0.9,3:1.2,4:1.2,5:1.1,6:1.0,7:0.8} as any)[w] ?? 1.0;

  // Status overrides
  if (status === 'preg_1_4') {
    return species === 'dog' ? 132 * pow(oBW, 0.75) : 140 * pow(oBW, 0.67);
  }
  if (status === 'preg_5_plus') {
    return species === 'dog' ? 132 * pow(oBW, 0.75) + 26 * oBW : 140 * pow(oBW, 0.67);
  }
  if (status === 'lactation') {
    if (species === 'dog') {
      const k = dogLactWeekCoef(lactationWeek || 1);
      if (litterCount > 0 && litterCount < 4) return 145 * pow(oBW, 0.75) + 24 * litterCount * oBW * k;
      if (litterCount >= 4) return 145 * pow(oBW, 0.75) + (96 + 12 * (litterCount - 4)) * oBW * k;
      return 145 * pow(oBW, 0.75);
    } else {
      const k = catLactWeekCoef(lactationWeek || 1);
      if (litterCount > 0 && litterCount < 3) return 100 * pow(oBW, 0.67) + 18 * oBW * k;
      if (litterCount === 3 || litterCount === 4) return 100 * pow(oBW, 0.67) + 60 * oBW * k;
      if (litterCount > 4) return 100 * pow(oBW, 0.67) + 70 * oBW * k;
      return 100 * pow(oBW, 0.67);
    }
  }

  // Adults (age in years)
  if (ageUnit === 'years') {
    if (species === 'dog') {
      if (age > 7) return 95 * pow(oBW, 0.75);
      if (age < 2.1) return 130 * pow(oBW, 0.75);
      switch (activity) {
        case 'low': return 95 * pow(oBW, 0.75);
        case 'moderate': return 110 * pow(oBW, 0.75);
        case 'high': return 130 * pow(oBW, 0.75);
        case 'obesity_prone': return 90 * pow(oBW, 0.75);
      }
      return 110 * pow(oBW, 0.75);
    } else {
      if (age > 7) return 75 * pow(oBW, 0.67);
      switch (activity) {
        case 'low': return 65 * pow(oBW, 0.67);
        case 'moderate': return 75 * pow(oBW, 0.67);
        case 'high': return 100 * pow(oBW, 0.67);
        case 'obesity_prone': return 65 * pow(oBW, 0.67);
      }
      return 75 * pow(oBW, 0.67);
    }
  }

  // Puppies/kittens
  const hasAdult = (adultWeight || 0) > 0;
  if (species === 'dog') {
    if (hasAdult) {
      if (ageWeeks < 8) return 250 * weight;
      if (ageWeeks >= 8.1) return (254.1 - 135.0 * (weight / adultWeight)) * pow(weight, 0.75);
    } else {
      if (ageWeeks < 21) return 175 * pow(oBW, 0.75);
      if (ageWeeks > 22) return 140 * pow(oBW, 0.75);
    }
  } else {
    if (ageWeeks < 18) return 2.3 * 70 * pow(weight, 0.67);
    if (ageWeeks >= 18 && ageWeeks < 39) return 1.9 * 70 * pow(weight, 0.67);
    if (ageWeeks >= 39) return 1.5 * 70 * pow(weight, 0.67);
  }

  return species === 'dog' ? 110 * pow(oBW, 0.75) : 75 * pow(oBW, 0.67);
}


