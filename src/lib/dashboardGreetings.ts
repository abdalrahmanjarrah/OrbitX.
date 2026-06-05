/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GreetingConfig {
  text: string;
  subtext: string;
}

// Group greetings by time of day and vibe to provide rich, non-repetitive variety
export const MORNING_GREETINGS: GreetingConfig[] = [
  { text: "أشرقت شمس مدارك الجديد.", subtext: "ابدأ يومك بجلسة تركيز لترسيخ إنتاجيتك." },
  { text: "جاهز لرحلة تركيز جديدة؟", subtext: "شروق مداري جديد يعني فرصاً لا حصر لها للإنجاز." },
  { text: "طاقتك الذهنية جاهزة للإقلاع.", subtext: "وجه تيار طاقتك الصباحية نحو مهمتك الكبرى اليوم." },
  { text: "مدارك الصباحي يبدأ بنشاط.", subtext: "خطوة واحدة دقيقة الآن ترسم ملامح يوم رائع." },
  { text: "صباح بنكهة الإنجاز الفضائي.", subtext: "قم بتهيئة بيئتك، واقفل باب التشتت، وانطلق." }
];

export const EVENING_GREETINGS: GreetingConfig[] = [
  { text: "المجرة بانتظار إنجازك القادم.", subtext: "استغل هدوء المساء لخلق تقدم مميز في مشاريعك." },
  { text: "كل دقيقة تركيز تقربك من مدار أعلى.", subtext: "حافظ على زخم يومك واستمر بالتقدم بخطى ثابتة." },
  { text: "ابدأ جلسة جديدة واكسر حدود التشتت.", subtext: "التدفق الذهني الكامل هو رفيقك لتجاوز العقبات." },
  { text: "مستويات تركيزك في أوج نشاطها.", subtext: "تحدَّ نفسك اليوم لتصل لعمق تركيز لم تبلغه من قبل." },
  { text: "انقطع عن صخب العالم الخارجي.", subtext: "استمتع بالرحلة المدارية الهادئة داخل محطة التركيز." }
];

export const NIGHT_GREETINGS: GreetingConfig[] = [
  { text: "هدوء الفضاء اللانهائي يحيط بك.", subtext: "أفضل الأفكار تولد في سكون الليل، ركّز بعمق." },
  { text: "أبحر في مدارات التركيز الهادئ.", subtext: "بينما ينام العالم، تصنع أنت نجاحك القادم بصمت." },
  { text: "سكون الليل هو وقود الإبداع.", subtext: "اختر مهمة واحدة، وركز كل مصابيح ذهنك عليها." },
  { text: "سفينة تركيزك تعبر العواصف بسلام.", subtext: "تقدمٌ هادئ ومستمر، خطوة بخطوة نحو نجومك." },
  { text: "الملاحة الليلية بدأت الآن.", subtext: "جلسة تركيز أخيرة تصنع فارقاً حقيقياً في إنجاز الغد." }
];

export const GENERAL_GREETINGS: GreetingConfig[] = [
  { text: "أهلاً بك في فضاء الإنجاز.", subtext: "حافظ على انتظام تنفسك وادخل في حالة التدفق." },
  { text: "لا حدود لما يمكنك إتمامه هنا.", subtext: "اترك المشتتات في الأسفل، وحلّق بذهنك بحرية." },
  { text: "مستعد للصعود لمدار التركيز الأقصى؟", subtext: "كل دقيقة تقضيها بوعي كامل هي نصر شخصي لك." },
  { text: "إتقان الحاضر هو بوابة عبور المستقبل.", subtext: "اجعل هدفك اليوم التركيز الكامل والعميق بلا تشتت." },
  { text: "خطوتك التالية هي الأهم.", subtext: "صفِ ذهنك تماماً، واستمتع بصوت السكون والإنجاز." }
];

/**
 * Returns a stable dynamic greeting based on the current hour of the day.
 * Includes fallback logic to avoid any initial client/server rendering mismatch.
 */
export function getGreetingForTime(hour?: number): GreetingConfig {
  const activeHour = hour !== undefined ? hour : new Date().getHours();
  
  let candidates: GreetingConfig[];
  
  if (activeHour >= 5 && activeHour < 12) {
    // 5 AM to 11:59 AM
    candidates = MORNING_GREETINGS;
  } else if (activeHour >= 12 && activeHour < 18) {
    // 12 PM to 5:59 PM
    candidates = EVENING_GREETINGS;
  } else if (activeHour >= 18 || activeHour < 5) {
    // 6 PM to 4:59 AM
    candidates = NIGHT_GREETINGS;
  } else {
    candidates = GENERAL_GREETINGS;
  }

  // Pick a randomized candidate based on a seed or simple random index
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] || GENERAL_GREETINGS[0];
}
