export interface CompletionMessageDetail {
  title: string;
  quote: string;
  badge: string;
}

export const COSMIC_COMPLETION_MESSAGES: CompletionMessageDetail[] = [
  {
    title: "اكتملت المناورة بنجاح 🚀",
    quote: "المحركات مستقرة ومسار الأسطول آمن. غلاف التركيز الاستراتيجي الخاص بك تجاوز سحب الغبار الكوني السحيق.",
    badge: "طيار مدار الفئة الأولى"
  },
  {
    title: "قفزة كمية ناجحة 🌌",
    quote: "شحنة الاندماج الفراغي داخل مفاعلك العقلي مستقرة تماماً. لقد حققت قفزة كمية جديدة وأضفت طاقة هائلة لنوافذ الملاحة.",
    badge: "مهندس اندماج الوعي"
  },
  {
    title: "مدار مستقر ومثالي 🛰️",
    quote: "المستشعرات ترصد اتزاناً عقلياً فائقاً. المدار ثابت تماماً حول كوكب الإنجاز، وأشعة التركيز تتوهج باللون الفيروزي.",
    badge: "مسؤول اتصالات النجمية"
  },
  {
    title: "حماية كهرومغناطيسية قصوى 🛡️",
    quote: "تم طرد تشتت الفضاء الخارجي. دروع الأستوديو الفكري صمدت أمام عواصف النيازك والضوضاء، والنتائج واعدة للغاية.",
    badge: "مراقب الملاحة العميقة"
  },
  {
    title: "عبور فلكي آمن ☄️",
    quote: "لقد أرسيت ركائز انتباهك بثبات وسط التيارات المذبذبة للزمان والفضول. الأسطول يفخر بمسارك الدراسي المنضبط.",
    badge: "مستكشف المجرة الفائقة"
  }
];

export function getRandomCosmicMessage(durationMinutes: number): CompletionMessageDetail {
  const index = Math.floor((durationMinutes + Date.now()) % COSMIC_COMPLETION_MESSAGES.length);
  return COSMIC_COMPLETION_MESSAGES[index];
}
