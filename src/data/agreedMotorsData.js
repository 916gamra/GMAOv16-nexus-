// src/data/agreedMotorsData.js
// AGREED PHILOSOPHY - الخريطة
// ref = إحداثيات المنزل - أصل في الخريطة قبل ما تكون الدار - من الشركة المصنعة - يدوي
// code = رقم الدار - اسم الدولة والمدينة والحي ورقم - داخلي للإنسان - mot 01, mot 02, etc.
// id = جواز سفر - كيجمع كولشي - ref + code + emplacement + zone - أوتوماتيكي

export const PHILOSOPHY = {
  ref: {
    definition: "إحداثيات المنزل - أصل في الخريطة قبل ما تكون الدار",
    source: "من الشركة المصنعة - من البلاكة - يدوي - التطبيق ما كيصنعوش",
    exemple: "Siemens 1LA7083-4AA, SKF 6204-2RS"
  },
  code: {
    definition: "رقم الدار - داخلي للإنسان",
    source: "كنعطيوه حنا باش نعقلو - يدوي ولا نص أوتوماتيكي",
    exemple: "Family: PRES, Template: POA, Machine: POA-03, Moteur réel: mot 01, mot 02, mot 23"
  },
  id: {
    definition: "جواز سفر - كيجمع كولشي - ref + code + emplacement + zone + historique",
    source: "أوتوماتيكي بالكامل - القواعد مبرمجة قبل",
    exemple: "ID-MOT01-REF-REF10A111NA-DET01-ZONE-DETOURAGE"
  }
};
