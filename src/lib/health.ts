// Pomocné zdravotní výpočty (věk, BMI a jeho kategorie).

export function calcAge(birthYear: number | null | undefined): number | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear;
  return age > 0 && age < 150 ? age : null;
}

export function calcBmi(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return Math.round(bmi * 10) / 10;
}

export type BmiTone = "blue" | "green" | "amber" | "red";
export type BmiCategory = { label: string; tone: BmiTone };

export function bmiCategory(bmi: number | null): BmiCategory | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return { label: "Podváha", tone: "blue" };
  if (bmi < 25) return { label: "Normální váha", tone: "green" };
  if (bmi < 30) return { label: "Nadváha", tone: "amber" };
  return { label: "Obezita", tone: "red" };
}
