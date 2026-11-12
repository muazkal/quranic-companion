export type Lang = 'en' | 'ar';

const en = {
  navDashboard: 'Dashboard', navReview: 'Review', navLibrary: 'Library', navAdd: 'Add',
  dashReady: 'Ready for your daily memorization?', dayStreak: 'day streak',
  dueToday: 'Due Today', reviewedCount: '{n} reviewed', memorized: 'Memorized', learning: 'Learning', totalItems: 'Total Items',
  itemsDue: '{n} item(s) due for review', keepStreak: 'Keep your streak going! Start your daily review now.',
  startReview: 'Start Review', allCaught: 'All caught up!', noneDue: 'No items due for review today. Great job staying consistent!',
  startJourney: 'Start your journey', addFirstToBegin: 'Add your first memorization item to begin', addFirst: 'Add First Item',
  recentItems: 'Recent Items', viewAll: 'View All',
  error: 'Error', noItemsReview: 'No items to review', sessionComplete: 'Session Complete!',
  addToStart: 'Add some items to your library to start reviewing.', reviewedN: 'You successfully reviewed {n} item(s). Great work!',
  backDashboard: 'Back to Dashboard', addMore: 'Add More Items', exit: 'Exit', doneRemaining: '{d} done · {r} remaining',
  hadith: 'Hadith', quran: "Qur'an", scholar: 'Mawqūf', narrator: 'Narrator', speaker: 'Speaker',
  openingWords: 'Opening words', nextWord: 'Next word ({n} left)', revealText: 'Reveal Text',
  recallHint: 'Try to recall the rest from the opening words, then reveal to check',
  translation: 'Translation', source: 'Source', howWell: 'How well did you remember?',
  again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', repeat: 'Repeat',
  library: 'Library', itemsN: '{n} items', addItem: 'Add Item', searchItems: 'Search items...', allTypes: 'All Types',
  libraryEmpty: 'Your library is empty', addFirstStart: 'Add your first memorization item to get started', noMatch: 'No items match your search',
  deleteQ: 'Delete this item?', deleteDesc: 'This action cannot be undone. This will permanently delete the item and all its review history.',
  cancel: 'Cancel', delete: 'Delete', itemDeleted: 'Item deleted', itemDeletedDesc: 'The item has been removed from your library.',
};

export type TKey = keyof typeof en;

const ar: Record<TKey, string> = {
  navDashboard: 'الرئيسية', navReview: 'المراجعة', navLibrary: 'المكتبة', navAdd: 'إضافة',
  dashReady: 'هل أنت مستعد لحفظك اليومي؟', dayStreak: 'أيام متتالية',
  dueToday: 'مستحق اليوم', reviewedCount: 'تمت مراجعة {n}', memorized: 'محفوظ', learning: 'قيد التعلم', totalItems: 'إجمالي العناصر',
  itemsDue: '{n} عنصر مستحق للمراجعة', keepStreak: 'حافظ على استمراريتك! ابدأ مراجعتك اليومية الآن.',
  startReview: 'ابدأ المراجعة', allCaught: 'أنهيت كل شيء!', noneDue: 'لا توجد عناصر مستحقة اليوم. أحسنت في المداومة!',
  startJourney: 'ابدأ رحلتك', addFirstToBegin: 'أضف أول عنصر للحفظ لتبدأ', addFirst: 'أضف أول عنصر',
  recentItems: 'العناصر الأخيرة', viewAll: 'عرض الكل',
  error: 'خطأ', noItemsReview: 'لا توجد عناصر للمراجعة', sessionComplete: 'اكتملت الجلسة!',
  addToStart: 'أضف بعض العناصر إلى مكتبتك لبدء المراجعة.', reviewedN: 'راجعت {n} عنصرًا بنجاح. أحسنت!',
  backDashboard: 'العودة إلى الرئيسية', addMore: 'أضف المزيد', exit: 'خروج', doneRemaining: '{d} منجز · {r} متبقٍ',
  hadith: 'حديث', quran: 'قرآن', scholar: 'موقوف', narrator: 'الراوي', speaker: 'القائل',
  openingWords: 'الكلمات الأولى', nextWord: 'الكلمة التالية (متبقٍ {n})', revealText: 'إظهار النص',
  recallHint: 'حاول تذكّر البقية من الكلمات الأولى، ثم أظهر النص للتحقق',
  translation: 'الترجمة', source: 'المصدر', howWell: 'ما مدى تذكّرك؟',
  again: 'مرة أخرى', hard: 'صعب', good: 'جيد', easy: 'سهل', repeat: 'تكرار',
  library: 'المكتبة', itemsN: '{n} عنصر', addItem: 'إضافة عنصر', searchItems: 'ابحث في العناصر...', allTypes: 'كل الأنواع',
  libraryEmpty: 'مكتبتك فارغة', addFirstStart: 'أضف أول عنصر للحفظ لتبدأ', noMatch: 'لا توجد عناصر مطابقة لبحثك',
  deleteQ: 'حذف هذا العنصر؟', deleteDesc: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف العنصر وسجل مراجعته نهائيًا.',
  cancel: 'إلغاء', delete: 'حذف', itemDeleted: 'تم حذف العنصر', itemDeletedDesc: 'تمت إزالة العنصر من مكتبتك.',
};

export const translations: Record<Lang, Record<TKey, string>> = { en, ar };
