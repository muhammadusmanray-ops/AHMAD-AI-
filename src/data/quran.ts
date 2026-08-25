export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  startPage: number;
}

export interface ReciterInfo {
  id: string;
  name: string;
  arabicName: string;
  subtext: string;
}

export interface ParaInfo {
  number: number;
  name: string;
  englishName: string;
  startPage: number;
}

export const PARA_LIST: ParaInfo[] = [
  { number: 1, name: "آلم", englishName: "Alif Lam Meem", startPage: 2 },
  { number: 2, name: "سَيَقُولُ", englishName: "Sayaqool", startPage: 22 },
  { number: 3, name: "تِلْكَ الرُّسُلُ", englishName: "Tilkal Rusull", startPage: 42 },
  { number: 4, name: "لَنْ تَنَالُوا", englishName: "Lan Tanalu", startPage: 62 },
  { number: 5, name: "وَالْمُحْصَنَاتُ", englishName: "Wal Muhsanat", startPage: 82 },
  { number: 6, name: "لَا يُحِبُّ اللَّهُ", englishName: "La Yuhibbulah", startPage: 102 },
  { number: 7, name: "وَإِذَا سَمِعُوا", englishName: "Wa Izha Samiu", startPage: 122 },
  { number: 8, name: "وَلَوْ أَنَّنَا", englishName: "Wa Law Annana", startPage: 142 },
  { number: 9, name: "قَالَ الْمَلَأُ", englishName: "Qalal Mala'u", startPage: 162 },
  { number: 10, name: "وَاعْلَمُوا", englishName: "Wa'lamu", startPage: 182 },
  { number: 11, name: "يَعْتَذِرُونَ", englishName: "Yataziroon", startPage: 202 },
  { number: 12, name: "وَمَا مِنْ دَابَّةٍ", englishName: "Wa Mamin Dabbah", startPage: 222 },
  { number: 13, name: "وَمَا أُبَرِّئُ", englishName: "Wa Ma Ubarri'u", startPage: 242 },
  { number: 14, name: "رُبَمَا", englishName: "Rubama", startPage: 262 },
  { number: 15, name: "سُبْحَانَ الَّذِي", englishName: "Subhanallazhi", startPage: 282 },
  { number: 16, name: "قَالَ أَلَمْ", englishName: "Qala Alam", startPage: 302 },
  { number: 17, name: "اقْتَرَبَ لِلنَّاسِ", englishName: "Iqtaraba Linnas", startPage: 322 },
  { number: 18, name: "قَدْ أَفْلَحَ", englishName: "Qad Aflaha", startPage: 342 },
  { number: 19, name: "وَقَالَ الَّذِينَ", englishName: "Wa Qalal Lazhina", startPage: 362 },
  { number: 20, name: "أَمَّنْ خَلَقَ", englishName: "A'man Khalaqa", startPage: 382 },
  { number: 21, name: "أُتْلُ مَا أُوحِيَ", englishName: "Utlu Ma Uhiya", startPage: 402 },
  { number: 22, name: "وَمَنْ يَقْنُتْ", englishName: "Wa Manyaqnut", startPage: 422 },
  { number: 23, name: "وَمَا لِيَ", englishName: "Wa Maliya", startPage: 442 },
  { number: 24, name: "فَمَنْ أَظْلَمُ", englishName: "Faman Azlamu", startPage: 462 },
  { number: 25, name: "إِلَيْهِ يُرَدُّ", englishName: "Elahe Yurad", startPage: 482 },
  { number: 26, name: "حم", englishName: "Ha'a Meem", startPage: 502 },
  { number: 27, name: "قَالَ فَمَا خَطْبُكُمْ", englishName: "Qala Fama Khatbukum", startPage: 522 },
  { number: 28, name: "قَدْ سَمِعَ اللَّهُ", englishName: "Qad Sami Allah", startPage: 542 },
  { number: 29, name: "تَبَارَكَ الَّذِي", englishName: "Tabarakallazhi", startPage: 562 },
  { number: 30, name: "عَمَّ", englishName: "Amma Yatasa'aloon", startPage: 582 },
];

export const RECITERS_LIST: ReciterInfo[] = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy", arabicName: "مشاري راشد العفاسي", subtext: "Natural & Clear Recitation" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit Abdus Samad", arabicName: "عبد الباسط عبد الصمد", subtext: "Classic Emotional Murattal" },
  { id: "ar.abdurrahmaansudais", name: "Abdur-Rahman As-Sudais", arabicName: "عبد الرحمن السديس", subtext: "Imam of Masjid al-Haram, Makkah" },
  { id: "ar.saadalghamdi", name: "Saad Al-Ghamdi", arabicName: "سعد الغامدي", subtext: "Melodic & Soothing Voice" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly", arabicName: "ماهر المعيقلي", subtext: "Imam of Masjid al-Haram, Makkah" },
  { id: "ar.shaatree", name: "Abu Bakr Al-Shatri", arabicName: "أبو بكر الشاطري", subtext: "Resonant & Expressive Recitation" },
  { id: "islam.sobhi", name: "Islam Sobhi", arabicName: "إسلام صبحي", subtext: "Emotional & Heart-Soothing" },
];

export const SURAH_LIST: SurahInfo[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatihah", englishNameTranslation: "The Opening", numberOfAyahs: 7, startPage: 1 },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", englishNameTranslation: "The Cow", numberOfAyahs: 286, startPage: 2 },
  { number: 3, name: "آل عمران", englishName: "Ali 'Imran", englishNameTranslation: "Family of Imran", numberOfAyahs: 200, startPage: 42 },
  { number: 4, name: "النساء", englishName: "An-Nisa", englishNameTranslation: "The Women", numberOfAyahs: 176, startPage: 71 },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", englishNameTranslation: "The Table Spread", numberOfAyahs: 120, startPage: 82 },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", englishNameTranslation: "The Cattle", numberOfAyahs: 165, startPage: 102 },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", englishNameTranslation: "The Heights", numberOfAyahs: 206, startPage: 122 },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", englishNameTranslation: "The Spoils of War", numberOfAyahs: 75, startPage: 142 },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", englishNameTranslation: "The Repentance", numberOfAyahs: 129, startPage: 151 },
  { number: 10, name: "يونس", englishName: "Yunus", englishNameTranslation: "Jonah", numberOfAyahs: 109, startPage: 162 },
  { number: 11, name: "هود", englishName: "Hud", englishNameTranslation: "Hud", numberOfAyahs: 123, startPage: 173 },
  { number: 12, name: "يوسف", englishName: "Yusuf", englishNameTranslation: "Joseph", numberOfAyahs: 111, startPage: 182 },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", englishNameTranslation: "The Thunder", numberOfAyahs: 43, startPage: 194 },
  { number: 14, name: "ابراهيم", englishName: "Ibrahim", englishNameTranslation: "Abraham", numberOfAyahs: 52, startPage: 199 },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", englishNameTranslation: "The Rocky Tract", numberOfAyahs: 99, startPage: 204 },
  { number: 16, name: "النحل", englishName: "An-Nahl", englishNameTranslation: "The Bee", numberOfAyahs: 128, startPage: 209 },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", englishNameTranslation: "The Night Journey", numberOfAyahs: 111, startPage: 222 },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", englishNameTranslation: "The Cave", numberOfAyahs: 110, startPage: 232 },
  { number: 19, name: "مريم", englishName: "Maryam", englishNameTranslation: "Mary", numberOfAyahs: 98, startPage: 242 },
  { number: 20, name: "طه", englishName: "Ta-Ha", englishNameTranslation: "Ta-Ha", numberOfAyahs: 135, startPage: 250 },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiya", englishNameTranslation: "The Prophets", numberOfAyahs: 112, startPage: 262 },
  { number: 22, name: "الحج", englishName: "Al-Hajj", englishNameTranslation: "The Pilgrimage", numberOfAyahs: 78, startPage: 270 },
  { number: 23, name: "المؤمنون", englishName: "Al-Mu'minun", englishNameTranslation: "The Believers", numberOfAyahs: 118, startPage: 279 },
  { number: 24, name: "النور", englishName: "An-Nur", englishNameTranslation: "The Light", numberOfAyahs: 64, startPage: 287 },
  { number: 25, name: "الفرقان", englishName: "Al-Furqan", englishNameTranslation: "The Criterion", numberOfAyahs: 77, startPage: 295 },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'ara", englishNameTranslation: "The Poets", numberOfAyahs: 227, startPage: 302 },
  { number: 27, name: "النمل", englishName: "An-Naml", englishNameTranslation: "The Ant", numberOfAyahs: 93, startPage: 311 },
  { number: 28, name: "القصص", englishName: "Al-Qasas", englishNameTranslation: "The Stories", numberOfAyahs: 88, startPage: 319 },
  { number: 29, name: "العنكبوت", englishName: "Al-'Ankabut", englishNameTranslation: "The Spider", numberOfAyahs: 69, startPage: 328 },
  { number: 30, name: "الروم", englishName: "Ar-Rum", englishNameTranslation: "The Romans", numberOfAyahs: 60, startPage: 334 },
  { number: 31, name: "لقمان", englishName: "Luqman", englishNameTranslation: "Luqman", numberOfAyahs: 34, startPage: 340 },
  { number: 32, name: "السجدة", englishName: "As-Sajdah", englishNameTranslation: "The Prostration", numberOfAyahs: 30, startPage: 344 },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzab", englishNameTranslation: "The Combined Forces", numberOfAyahs: 73, startPage: 346 },
  { number: 34, name: "سبإ", englishName: "Saba", englishNameTranslation: "Sheba", numberOfAyahs: 54, startPage: 356 },
  { number: 35, name: "فاطر", englishName: "Fatir", englishNameTranslation: "Originator", numberOfAyahs: 45, startPage: 362 },
  { number: 36, name: "يس", englishName: "Ya-Sin", englishNameTranslation: "Ya Sin", numberOfAyahs: 83, startPage: 368 },
  { number: 37, name: "الصافات", englishName: "As-Saffat", englishNameTranslation: "Those who set the Ranks", numberOfAyahs: 182, startPage: 374 },
  { number: 38, name: "ص", englishName: "Sad", englishNameTranslation: "The Letter Sad", numberOfAyahs: 88, startPage: 382 },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", englishNameTranslation: "The Troops", numberOfAyahs: 75, startPage: 387 },
  { number: 40, name: "غافر", englishName: "Ghafir", englishNameTranslation: "The Forgiver", numberOfAyahs: 85, startPage: 395 },
  { number: 41, name: "فصلت", englishName: "Fussilat", englishNameTranslation: "Explained in Detail", numberOfAyahs: 54, startPage: 404 },
  { number: 42, name: "الشورى", englishName: "Ash-Shuraa", englishNameTranslation: "The Consultation", numberOfAyahs: 53, startPage: 410 },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", englishNameTranslation: "The Ornaments of Gold", numberOfAyahs: 89, startPage: 416 },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhan", englishNameTranslation: "The Smoke", numberOfAyahs: 59, startPage: 422 },
  { number: 45, name: "الجاثية", englishName: "Al-Jathiyah", englishNameTranslation: "The Crouching", numberOfAyahs: 37, startPage: 425 },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", englishNameTranslation: "The Wind-Curved Sandhills", numberOfAyahs: 35, startPage: 429 },
  { number: 47, name: "محمد", englishName: "Muhammad", englishNameTranslation: "Muhammad", numberOfAyahs: 38, startPage: 434 },
  { number: 48, name: "الفتح", englishName: "Al-Fath", englishNameTranslation: "The Victory", numberOfAyahs: 29, startPage: 438 },
  { number: 49, name: "الحجرات", englishName: "Al-Hujurat", englishNameTranslation: "The Rooms", numberOfAyahs: 18, startPage: 442 },
  { number: 50, name: "ق", englishName: "Qaf", englishNameTranslation: "The Letter Qaf", numberOfAyahs: 45, startPage: 445 },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhariyat", englishNameTranslation: "The Winnowing Winds", numberOfAyahs: 60, startPage: 448 },
  { number: 52, name: "الطور", englishName: "At-Tur", englishNameTranslation: "The Mount", numberOfAyahs: 49, startPage: 451 },
  { number: 53, name: "النجم", englishName: "An-Najm", englishNameTranslation: "The Star", numberOfAyahs: 62, startPage: 454 },
  { number: 54, name: "القمر", englishName: "Al-Qamar", englishNameTranslation: "The Moon", numberOfAyahs: 55, startPage: 456 },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent", numberOfAyahs: 78, startPage: 460 },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", englishNameTranslation: "The Inevitable", numberOfAyahs: 96, startPage: 463 },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", englishNameTranslation: "The Iron", numberOfAyahs: 29, startPage: 466 },
  { number: 58, name: "المجادلة", englishName: "Al-Mujadila", englishNameTranslation: "The Pleading Woman", numberOfAyahs: 22, startPage: 471 },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", englishNameTranslation: "The Exile", numberOfAyahs: 24, startPage: 475 },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", englishNameTranslation: "She that is to be examined", numberOfAyahs: 13, startPage: 478 },
  { number: 61, name: "الصف", englishName: "As-Saf", englishNameTranslation: "The Ranks", numberOfAyahs: 14, startPage: 481 },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'ah", englishNameTranslation: "The Congregation", numberOfAyahs: 11, startPage: 483 },
  { number: 63, name: "المنافقون", englishName: "Al-Munafiqun", englishNameTranslation: "The Hypocrites", numberOfAyahs: 11, startPage: 485 },
  { number: 64, name: "التغابن", englishName: "At-Taghabun", englishNameTranslation: "The Mutual Disillusion", numberOfAyahs: 18, startPage: 487 },
  { number: 65, name: "الطلاق", englishName: "At-Talaq", englishNameTranslation: "The Divorce", numberOfAyahs: 12, startPage: 489 },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", englishNameTranslation: "The Prohibition", numberOfAyahs: 12, startPage: 491 },
  { number: 67, name: "الملك", englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty", numberOfAyahs: 30, startPage: 493 },
  { number: 68, name: "القلم", englishName: "Al-Qalam", englishNameTranslation: "The Pen", numberOfAyahs: 52, startPage: 496 },
  { number: 69, name: "الحاقة", englishName: "Al-Haqqah", englishNameTranslation: "The Reality", numberOfAyahs: 52, startPage: 498 },
  { number: 70, name: "المعارج", englishName: "Al-Ma'arij", englishNameTranslation: "The Ascending Stairways", numberOfAyahs: 44, startPage: 501 },
  { number: 71, name: "نوح", englishName: "Nuh", englishNameTranslation: "Noah", numberOfAyahs: 28, startPage: 503 },
  { number: 72, name: "الجن", englishName: "Al-Jinn", englishNameTranslation: "The Jinn", numberOfAyahs: 28, startPage: 505 },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", englishNameTranslation: "The Enshrouded One", numberOfAyahs: 20, startPage: 507 },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", englishNameTranslation: "The Cloaked One", numberOfAyahs: 56, startPage: 509 },
  { number: 75, name: "القيامة", englishName: "Al-Qiyamah", englishNameTranslation: "The Resurrection", numberOfAyahs: 40, startPage: 511 },
  { number: 76, name: "الإنسان", englishName: "Al-Insan", englishNameTranslation: "Man", numberOfAyahs: 31, startPage: 513 },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalat", englishNameTranslation: "The Emissaries", numberOfAyahs: 50, startPage: 515 },
  { number: 78, name: "النبإ", englishName: "An-Naba", englishNameTranslation: "The Tidings", numberOfAyahs: 40, startPage: 517 },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", englishNameTranslation: "Those who drag forth", numberOfAyahs: 46, startPage: 519 },
  { number: 80, name: "عبس", englishName: "'Abasa", englishNameTranslation: "He Frowned", numberOfAyahs: 42, startPage: 521 },
  { number: 81, name: "التكوير", englishName: "At-Takwir", englishNameTranslation: "The Overthrowing", numberOfAyahs: 29, startPage: 522 },
  { number: 82, name: "الانفطار", englishName: "Al-Infitar", englishNameTranslation: "The Cleaving", numberOfAyahs: 19, startPage: 524 },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", englishNameTranslation: "The Defrauding", numberOfAyahs: 36, startPage: 525 },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", englishNameTranslation: "The Splitting Open", numberOfAyahs: 25, startPage: 527 },
  { number: 85, name: "البروج", englishName: "Al-Buruj", englishNameTranslation: "The Constellations", numberOfAyahs: 22, startPage: 528 },
  { number: 86, name: "الطارق", englishName: "At-Tariq", englishNameTranslation: "The Nightcomer", numberOfAyahs: 17, startPage: 529 },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", englishNameTranslation: "The Most High", numberOfAyahs: 19, startPage: 530 },
  { number: 88, name: "الغاشية", englishName: "Al-Ghashiyah", englishNameTranslation: "The Overwhelming", numberOfAyahs: 26, startPage: 531 },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", englishNameTranslation: "The Dawn", numberOfAyahs: 30, startPage: 532 },
  { number: 90, name: "البلد", englishName: "Al-Balad", englishNameTranslation: "The City", numberOfAyahs: 20, startPage: 534 },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", englishNameTranslation: "The Sun", numberOfAyahs: 15, startPage: 535 },
  { number: 92, name: "الليل", englishName: "Al-Layl", englishNameTranslation: "The Night", numberOfAyahs: 21, startPage: 536 },
  { number: 93, name: "الضحى", englishName: "Ad-Duhaa", englishNameTranslation: "The Morning Hours", numberOfAyahs: 11, startPage: 537 },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", englishNameTranslation: "The Relief", numberOfAyahs: 8, startPage: 537 },
  { number: 95, name: "التين", englishName: "At-Tin", englishNameTranslation: "The Fig", numberOfAyahs: 8, startPage: 538 },
  { number: 96, name: "العلق", englishName: "Al-'Alaq", englishNameTranslation: "The Clot", numberOfAyahs: 19, startPage: 538 },
  { number: 97, name: "القدر", englishName: "Al-Qadr", englishNameTranslation: "The Power", numberOfAyahs: 5, startPage: 539 },
  { number: 98, name: "البينة", englishName: "Al-Bayyinah", englishNameTranslation: "The Clear Proof", numberOfAyahs: 8, startPage: 539 },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzalah", englishNameTranslation: "The Earthquake", numberOfAyahs: 8, startPage: 540 },
  { number: 100, name: "العاديات", englishName: "Al-'Adiyat", englishNameTranslation: "The Courser", numberOfAyahs: 11, startPage: 541 },
  { number: 101, name: "القارعة", englishName: "Al-Qari'ah", englishNameTranslation: "The Calamity", numberOfAyahs: 11, startPage: 541 },
  { number: 102, name: "التكاثر", englishName: "At-Takathur", englishNameTranslation: "The Rivalry in world increase", numberOfAyahs: 8, startPage: 542 },
  { number: 103, name: "العصر", englishName: "Al-'Asr", englishNameTranslation: "The Declining Day", numberOfAyahs: 3, startPage: 542 },
  { number: 104, name: "الهمزة", englishName: "Al-Humazah", englishNameTranslation: "The Traducer", numberOfAyahs: 9, startPage: 543 },
  { number: 105, name: "الفيل", englishName: "Al-Fil", englishNameTranslation: "The Elephant", numberOfAyahs: 5, startPage: 543 },
  { number: 106, name: "قريش", englishName: "Quraysh", englishNameTranslation: "Quraysh", numberOfAyahs: 4, startPage: 544 },
  { number: 107, name: "الماعون", englishName: "Al-Ma'un", englishNameTranslation: "The Small Kindnesses", numberOfAyahs: 7, startPage: 544 },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", englishNameTranslation: "The Abundance", numberOfAyahs: 3, startPage: 545 },
  { number: 109, name: "الكافرون", englishName: "Al-Kafirun", englishNameTranslation: "The Disbelievers", numberOfAyahs: 6, startPage: 545 },
  { number: 110, name: "النصر", englishName: "An-Nasr", englishNameTranslation: "The Divine Support", numberOfAyahs: 3, startPage: 545 },
  { number: 111, name: "المسد", englishName: "Al-Masad", englishNameTranslation: "The Palm Fiber", numberOfAyahs: 5, startPage: 546 },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", englishNameTranslation: "The Sincerity", numberOfAyahs: 4, startPage: 546 },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", englishNameTranslation: "The Daybreak", numberOfAyahs: 5, startPage: 546 },
  { number: 114, name: "الناس", englishName: "An-Nas", englishNameTranslation: "Mankind", numberOfAyahs: 6, startPage: 547 }
];

export function getSurahByNumber(num: number): SurahInfo | undefined {
  return SURAH_LIST.find(s => s.number === num);
}

export function getSurahByName(query: string): SurahInfo | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  return SURAH_LIST.find(s => {
    const sEng = s.englishName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sTrans = s.englishNameTranslation.toLowerCase().replace(/[^a-z0-9]/g, "");
    return sEng.includes(q) || q.includes(sEng) || sTrans.includes(q);
  });
}

