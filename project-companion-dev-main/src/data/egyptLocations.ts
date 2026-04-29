export interface District {
  name: string;
  nameAr: string;
}

export interface Governorate {
  name: string;
  nameAr: string;
  districts: District[];
}

export const egyptGovernorates: Governorate[] = [
  {
    name: "Cairo",
    nameAr: "القاهرة",
    districts: [
      { name: "Downtown", nameAr: "وسط البلد" },
      { name: "Nasr City", nameAr: "مدينة نصر" },
      { name: "Heliopolis", nameAr: "مصر الجديدة" },
      { name: "Maadi", nameAr: "المعادي" },
      { name: "New Cairo", nameAr: "القاهرة الجديدة" },
      { name: "Shubra", nameAr: "شبرا" },
      { name: "Ain Shams", nameAr: "عين شمس" },
      { name: "El Marg", nameAr: "المرج" },
      { name: "El Matareya", nameAr: "المطرية" },
      { name: "El Zamalek", nameAr: "الزمالك" },
      { name: "Garden City", nameAr: "جاردن سيتي" },
      { name: "El Rehab", nameAr: "الرحاب" },
      { name: "Madinet El Salam", nameAr: "مدينة السلام" },
      { name: "El Basateen", nameAr: "البساتين" },
      { name: "Dar El Salam", nameAr: "دار السلام" },
    ],
  },
  {
    name: "Giza",
    nameAr: "الجيزة",
    districts: [
      { name: "Dokki", nameAr: "الدقي" },
      { name: "Mohandessin", nameAr: "المهندسين" },
      { name: "Agouza", nameAr: "العجوزة" },
      { name: "Haram", nameAr: "الهرم" },
      { name: "Faisal", nameAr: "فيصل" },
      { name: "6th of October", nameAr: "السادس من أكتوبر" },
      { name: "Sheikh Zayed", nameAr: "الشيخ زايد" },
      { name: "Imbaba", nameAr: "إمبابة" },
      { name: "El Omraniya", nameAr: "العمرانية" },
      { name: "Bulaq El Dakrour", nameAr: "بولاق الدكرور" },
    ],
  },
  {
    name: "Alexandria",
    nameAr: "الإسكندرية",
    districts: [
      { name: "Smouha", nameAr: "سموحة" },
      { name: "Sidi Gaber", nameAr: "سيدي جابر" },
      { name: "Mandara", nameAr: "المندرة" },
      { name: "Miami", nameAr: "ميامي" },
      { name: "Stanley", nameAr: "ستانلي" },
      { name: "Gleem", nameAr: "جليم" },
      { name: "Roushdy", nameAr: "رشدي" },
      { name: "Borg El Arab", nameAr: "برج العرب" },
      { name: "Agami", nameAr: "العجمي" },
      { name: "Montazah", nameAr: "المنتزه" },
    ],
  },
  {
    name: "Qalyubia",
    nameAr: "القليوبية",
    districts: [
      { name: "Banha", nameAr: "بنها" },
      { name: "Shubra El Kheima", nameAr: "شبرا الخيمة" },
      { name: "Qalyub", nameAr: "قليوب" },
      { name: "El Khanka", nameAr: "الخانكة" },
      { name: "El Obour", nameAr: "العبور" },
      { name: "Badr City", nameAr: "مدينة بدر" },
    ],
  },
  {
    name: "Dakahlia",
    nameAr: "الدقهلية",
    districts: [
      { name: "Mansoura", nameAr: "المنصورة" },
      { name: "Talkha", nameAr: "طلخا" },
      { name: "Mit Ghamr", nameAr: "ميت غمر" },
      { name: "Aga", nameAr: "أجا" },
      { name: "Belqas", nameAr: "بلقاس" },
    ],
  },
  {
    name: "Sharqia",
    nameAr: "الشرقية",
    districts: [
      { name: "Zagazig", nameAr: "الزقازيق" },
      { name: "10th of Ramadan", nameAr: "العاشر من رمضان" },
      { name: "Belbeis", nameAr: "بلبيس" },
      { name: "Minya El Qamh", nameAr: "منيا القمح" },
      { name: "Abu Hammad", nameAr: "أبو حماد" },
    ],
  },
  {
    name: "Gharbia",
    nameAr: "الغربية",
    districts: [
      { name: "Tanta", nameAr: "طنطا" },
      { name: "El Mahalla El Kubra", nameAr: "المحلة الكبرى" },
      { name: "Kafr El Zayat", nameAr: "كفر الزيات" },
      { name: "Zefta", nameAr: "زفتى" },
    ],
  },
  {
    name: "Monufia",
    nameAr: "المنوفية",
    districts: [
      { name: "Shibin El Kom", nameAr: "شبين الكوم" },
      { name: "Menouf", nameAr: "منوف" },
      { name: "Sadat City", nameAr: "مدينة السادات" },
      { name: "Ashmoun", nameAr: "أشمون" },
    ],
  },
  {
    name: "Kafr El Sheikh",
    nameAr: "كفر الشيخ",
    districts: [
      { name: "Kafr El Sheikh City", nameAr: "مدينة كفر الشيخ" },
      { name: "Desouk", nameAr: "دسوق" },
      { name: "Baltim", nameAr: "بلطيم" },
      { name: "Fuwwah", nameAr: "فوة" },
    ],
  },
  {
    name: "Beheira",
    nameAr: "البحيرة",
    districts: [
      { name: "Damanhour", nameAr: "دمنهور" },
      { name: "Kafr El Dawwar", nameAr: "كفر الدوار" },
      { name: "Rashid (Rosetta)", nameAr: "رشيد" },
      { name: "Edku", nameAr: "إدكو" },
    ],
  },
  {
    name: "Damietta",
    nameAr: "دمياط",
    districts: [
      { name: "Damietta City", nameAr: "مدينة دمياط" },
      { name: "New Damietta", nameAr: "دمياط الجديدة" },
      { name: "Ras El Bar", nameAr: "رأس البر" },
      { name: "Faraskour", nameAr: "فارسكور" },
    ],
  },
  {
    name: "Port Said",
    nameAr: "بورسعيد",
    districts: [
      { name: "Port Said City", nameAr: "مدينة بورسعيد" },
      { name: "Port Fouad", nameAr: "بور فؤاد" },
      { name: "El Arab", nameAr: "العرب" },
    ],
  },
  {
    name: "Ismailia",
    nameAr: "الإسماعيلية",
    districts: [
      { name: "Ismailia City", nameAr: "مدينة الإسماعيلية" },
      { name: "Fayed", nameAr: "فايد" },
      { name: "El Qantara", nameAr: "القنطرة" },
      { name: "Abu Sultan", nameAr: "أبو سلطان" },
    ],
  },
  {
    name: "Suez",
    nameAr: "السويس",
    districts: [
      { name: "Suez City", nameAr: "مدينة السويس" },
      { name: "Ain Sokhna", nameAr: "العين السخنة" },
      { name: "Ataka", nameAr: "عتاقة" },
    ],
  },
  {
    name: "Fayoum",
    nameAr: "الفيوم",
    districts: [
      { name: "Fayoum City", nameAr: "مدينة الفيوم" },
      { name: "Ibsheway", nameAr: "إبشواي" },
      { name: "Tamiya", nameAr: "طامية" },
      { name: "Sennoures", nameAr: "سنورس" },
    ],
  },
  {
    name: "Beni Suef",
    nameAr: "بني سويف",
    districts: [
      { name: "Beni Suef City", nameAr: "مدينة بني سويف" },
      { name: "El Wasta", nameAr: "الواسطى" },
      { name: "Nasser", nameAr: "ناصر" },
      { name: "Beba", nameAr: "ببا" },
    ],
  },
  {
    name: "Minya",
    nameAr: "المنيا",
    districts: [
      { name: "Minya City", nameAr: "مدينة المنيا" },
      { name: "Mallawi", nameAr: "ملوي" },
      { name: "Samalut", nameAr: "سمالوط" },
      { name: "Abu Qurqas", nameAr: "أبو قرقاص" },
      { name: "Beni Mazar", nameAr: "بني مزار" },
    ],
  },
  {
    name: "Assiut",
    nameAr: "أسيوط",
    districts: [
      { name: "Assiut City", nameAr: "مدينة أسيوط" },
      { name: "Dairut", nameAr: "ديروط" },
      { name: "Manfalut", nameAr: "منفلوط" },
      { name: "El Qusiya", nameAr: "القوصية" },
      { name: "Abu Tig", nameAr: "أبو تيج" },
    ],
  },
  {
    name: "Sohag",
    nameAr: "سوهاج",
    districts: [
      { name: "Sohag City", nameAr: "مدينة سوهاج" },
      { name: "Akhmim", nameAr: "أخميم" },
      { name: "Girga", nameAr: "جرجا" },
      { name: "Tahta", nameAr: "طهطا" },
      { name: "El Maragha", nameAr: "المراغة" },
    ],
  },
  {
    name: "Qena",
    nameAr: "قنا",
    districts: [
      { name: "Qena City", nameAr: "مدينة قنا" },
      { name: "Nag Hammadi", nameAr: "نجع حمادي" },
      { name: "Luxor", nameAr: "الأقصر" },
      { name: "Qus", nameAr: "قوص" },
      { name: "Dishna", nameAr: "دشنا" },
    ],
  },
  {
    name: "Luxor",
    nameAr: "الأقصر",
    districts: [
      { name: "Luxor City", nameAr: "مدينة الأقصر" },
      { name: "Esna", nameAr: "إسنا" },
      { name: "Armant", nameAr: "أرمنت" },
      { name: "El Tod", nameAr: "الطود" },
    ],
  },
  {
    name: "Aswan",
    nameAr: "أسوان",
    districts: [
      { name: "Aswan City", nameAr: "مدينة أسوان" },
      { name: "Edfu", nameAr: "إدفو" },
      { name: "Kom Ombo", nameAr: "كوم أمبو" },
      { name: "Abu Simbel", nameAr: "أبو سمبل" },
    ],
  },
  {
    name: "Red Sea",
    nameAr: "البحر الأحمر",
    districts: [
      { name: "Hurghada", nameAr: "الغردقة" },
      { name: "Safaga", nameAr: "سفاجا" },
      { name: "El Gouna", nameAr: "الجونة" },
      { name: "Marsa Alam", nameAr: "مرسى علم" },
    ],
  },
  {
    name: "New Valley",
    nameAr: "الوادي الجديد",
    districts: [
      { name: "El Kharga", nameAr: "الخارجة" },
      { name: "El Dakhla", nameAr: "الداخلة" },
      { name: "Farafra", nameAr: "الفرافرة" },
      { name: "Paris", nameAr: "باريس" },
    ],
  },
  {
    name: "Matrouh",
    nameAr: "مطروح",
    districts: [
      { name: "Marsa Matrouh", nameAr: "مرسى مطروح" },
      { name: "El Alamein", nameAr: "العلمين" },
      { name: "Siwa", nameAr: "سيوة" },
      { name: "El Dabaa", nameAr: "الضبعة" },
    ],
  },
  {
    name: "North Sinai",
    nameAr: "شمال سيناء",
    districts: [
      { name: "El Arish", nameAr: "العريش" },
      { name: "Rafah", nameAr: "رفح" },
      { name: "Sheikh Zuweid", nameAr: "الشيخ زويد" },
      { name: "Bir El Abd", nameAr: "بئر العبد" },
    ],
  },
  {
    name: "South Sinai",
    nameAr: "جنوب سيناء",
    districts: [
      { name: "Sharm El Sheikh", nameAr: "شرم الشيخ" },
      { name: "Dahab", nameAr: "دهب" },
      { name: "Nuweiba", nameAr: "نويبع" },
      { name: "Taba", nameAr: "طابا" },
      { name: "Saint Catherine", nameAr: "سانت كاترين" },
    ],
  },
];
