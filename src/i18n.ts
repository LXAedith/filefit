const en = {
  app_title: "FileFit — shrink, convert & clean files privately",
  hero_title: "File too big? Wrong format? Fixed.",
  hero_tagline: "Shrink, convert and clean your files right in your browser. Nothing is ever uploaded.",
  badge_private: "Files never leave your device",
  badge_offline: "Works offline",
  badge_free: "Free & open source · no sign-up",

  tool_fit: "Fit to size",
  tool_fit_desc: "Get photos under a size limit like 200 KB for forms, portals and email.",
  tool_convert: "Convert images",
  tool_convert_desc: "iPhone HEIC, PNG, WebP, AVIF → JPG, PNG or WebP.",
  tool_pdf: "Make a PDF",
  tool_pdf_desc: "Merge PDFs and photos into one PDF, in the order you choose.",
  tool_clean: "Remove hidden data",
  tool_clean_desc: "See and remove the GPS location, camera and date hidden in photos.",

  drop_title: "Drop files here",
  drop_hint: "or click to choose · paste with Ctrl+V",

  opt_target: "Size limit",
  opt_custom: "Custom",
  opt_format: "Format",
  opt_quality: "Quality",
  opt_max_side: "Max. width/height",
  opt_original: "Original",
  opt_page_size: "Page size",
  opt_page_fit: "Same as image",
  opt_margins: "Margins",
  opt_image_quality: "Image quality",
  q_high: "High",
  q_medium: "Balanced",
  q_small: "Smallest file",
  hint_target: "Stays under the limit whether the site counts 1 KB as 1000 or 1024 bytes.",
  hint_webp: "Your browser can't save WebP, so JPG will be used.",
  hint_pdf: "Use the arrows to set the page order.",
  hint_clean: "JPG, PNG and WebP are cleaned without any loss in quality.",

  run_fit: "Shrink",
  run_convert: "Convert",
  run_pdf: "Create PDF",
  run_clean: "Remove hidden data",
  working: "Working… {done}/{total}",
  download: "Download",
  download_all: "Download all (ZIP)",
  clear: "Clear list",
  remove: "Remove",
  move_up: "Move up",
  move_down: "Move down",
  file_one: "1 file",
  file_other: "{n} files",
  page_one: "1 page",
  page_other: "{n} pages",

  status_queued: "Ready",
  status_working: "Working…",
  status_error: "Failed",

  note_already_fits: "Already under the limit · hidden data removed",
  note_fitted: "{w}×{h} px · quality {q}%",
  note_not_reached: "Couldn't get under the limit, this is the smallest version",
  note_size: "{w}×{h} px",
  note_lossless: "Cleaned without touching image quality",
  note_reencoded: "Saved as a clean JPG",

  meta_scanning: "Looking for hidden data…",
  meta_none: "No hidden data found",
  meta_gps_warning: "Reveals where this photo was taken",
  meta_camera: "Camera",
  meta_date: "Taken",
  meta_software: "Software",
  meta_author: "Author",
  meta_fields: "{n} hidden fields in total",
  meta_map: "Show on map",
  meta_removed: "{n} hidden fields removed",

  err_unsupported: "This file type isn't supported here",
  err_decode: "Couldn't read this image",
  err_pdfEncrypted: "This PDF is password-protected",
  err_pdfInvalid: "Couldn't read this PDF",
  err_generic: "Something went wrong",

  summary_saved: "Saved {size} · {pct}% smaller",
  pdf_ready: "Your PDF is ready",

  footer_privacy:
    "Everything happens inside your browser. A strict security policy (CSP) blocks this page from sending your files anywhere: check it in your browser's developer tools, or turn off Wi-Fi and keep using it.",
  footer_source: "Source code on GitHub",
  footer_license: "MIT licensed",
  install: "Install app",
  lang_name: "Türkçe",
};

export type Key = keyof typeof en;

const tr: Record<Key, string> = {
  app_title: "FileFit — dosyaları cihazında küçült, dönüştür ve temizle",
  hero_title: "Dosya çok mu büyük? Formatı mı yanlış? Hallettik.",
  hero_tagline: "Dosyalarını doğrudan tarayıcında küçült, dönüştür ve temizle. Hiçbir şey internete yüklenmez.",
  badge_private: "Dosyalar cihazından çıkmaz",
  badge_offline: "İnternetsiz çalışır",
  badge_free: "Ücretsiz ve açık kaynak · üyelik yok",

  tool_fit: "Boyuta sığdır",
  tool_fit_desc: "Fotoğrafları formlar, başvuru siteleri ve e-posta için 200 KB gibi bir sınırın altına indir.",
  tool_convert: "Resim dönüştür",
  tool_convert_desc: "iPhone HEIC, PNG, WebP, AVIF → JPG, PNG veya WebP.",
  tool_pdf: "PDF oluştur",
  tool_pdf_desc: "PDF'leri ve fotoğrafları istediğin sırayla tek bir PDF'te birleştir.",
  tool_clean: "Gizli bilgileri sil",
  tool_clean_desc: "Fotoğraflarda gizlenen GPS konumunu, kamera ve tarih bilgisini gör ve sil.",

  drop_title: "Dosyaları buraya bırak",
  drop_hint: "ya da tıklayıp seç · Ctrl+V ile yapıştır",

  opt_target: "Boyut sınırı",
  opt_custom: "Özel",
  opt_format: "Format",
  opt_quality: "Kalite",
  opt_max_side: "En fazla genişlik/yükseklik",
  opt_original: "Orijinal",
  opt_page_size: "Sayfa boyutu",
  opt_page_fit: "Resimle aynı",
  opt_margins: "Kenar boşluğu",
  opt_image_quality: "Resim kalitesi",
  q_high: "Yüksek",
  q_medium: "Dengeli",
  q_small: "En küçük dosya",
  hint_target: "Site 1 KB'ı 1000 ya da 1024 bayt saysa da sınırın altında kalır.",
  hint_webp: "Tarayıcın WebP kaydedemiyor, bu yüzden JPG kullanılacak.",
  hint_pdf: "Sayfa sırasını oklarla ayarla.",
  hint_clean: "JPG, PNG ve WebP dosyaları hiç kalite kaybı olmadan temizlenir.",

  run_fit: "Küçült",
  run_convert: "Dönüştür",
  run_pdf: "PDF oluştur",
  run_clean: "Gizli bilgileri sil",
  working: "İşleniyor… {done}/{total}",
  download: "İndir",
  download_all: "Tümünü indir (ZIP)",
  clear: "Listeyi boşalt",
  remove: "Kaldır",
  move_up: "Yukarı taşı",
  move_down: "Aşağı taşı",
  file_one: "1 dosya",
  file_other: "{n} dosya",
  page_one: "1 sayfa",
  page_other: "{n} sayfa",

  status_queued: "Hazır",
  status_working: "İşleniyor…",
  status_error: "Başarısız",

  note_already_fits: "Zaten sınırın altında · gizli bilgiler silindi",
  note_fitted: "{w}×{h} px · kalite %{q}",
  note_not_reached: "Sınırın altına inilemedi, bu en küçük hali",
  note_size: "{w}×{h} px",
  note_lossless: "Görüntü kalitesine dokunmadan temizlendi",
  note_reencoded: "Temiz bir JPG olarak kaydedildi",

  meta_scanning: "Gizli bilgiler aranıyor…",
  meta_none: "Gizli bilgi bulunamadı",
  meta_gps_warning: "Bu fotoğrafın nerede çekildiğini gösteriyor",
  meta_camera: "Kamera",
  meta_date: "Çekilme",
  meta_software: "Yazılım",
  meta_author: "Sahibi",
  meta_fields: "toplam {n} gizli alan",
  meta_map: "Haritada göster",
  meta_removed: "{n} gizli alan silindi",

  err_unsupported: "Bu dosya türü burada desteklenmiyor",
  err_decode: "Bu resim okunamadı",
  err_pdfEncrypted: "Bu PDF parola korumalı",
  err_pdfInvalid: "Bu PDF okunamadı",
  err_generic: "Bir şeyler ters gitti",

  summary_saved: "{size} kazandın · %{pct} daha küçük",
  pdf_ready: "PDF'in hazır",

  footer_privacy:
    "Her şey tarayıcının içinde olur. Sıkı bir güvenlik politikası (CSP) bu sayfanın dosyalarını herhangi bir yere göndermesini engeller: tarayıcının geliştirici araçlarından kontrol edebilir ya da Wi-Fi'ı kapatıp kullanmaya devam edebilirsin.",
  footer_source: "GitHub'da kaynak kodu",
  footer_license: "MIT lisanslı",
  install: "Uygulamayı yükle",
  lang_name: "English",
};

export type Lang = "en" | "tr";
const dictionaries: Record<Lang, Record<Key, string>> = { en, tr };
const STORAGE_KEY = "filefit:lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "tr") return saved;
  } catch {
    // storage blocked (private mode etc.)
  }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

let current: Lang = initialLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not fatal
  }
}

export function locale(): string {
  return current === "tr" ? "tr-TR" : "en-US";
}

export function t(key: Key, params: Record<string, string | number> = {}): string {
  return dictionaries[current][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ""));
}

export function plural(n: number, one: Key, other: Key): string {
  return t(n === 1 ? one : other, { n });
}
