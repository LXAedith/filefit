# Pazar araştırması: Günlük bilgisayar kullanıcısının en büyük sorunu ne?

*Kasım 2026. Amaç: kolayca geliştirilip GitHub'da yayınlanabilecek, gerçekten işe yarayan bir açık kaynak proje seçmek.*

## Özet

Günlük kullanıcıların en çok yaşadığı sorunlar üç kümede toplanıyor:

1. **Yavaşlık, donma ve çökme**: en sık şikâyet bu ama donanım ve işletim sistemi kaynaklı. Küçük bir uygulamayla çözülemez.
2. **Dağınıklık ve bilgi arama**: haftada 4–9 saat kaybettiriyor. Çözmek için işletim sistemi seviyesinde dizinleme gerekiyor ve büyük oyuncular (Spotlight, Windows Search, Everything) zaten bu alanda.
3. **Gündelik dosya işleri**: "dosya çok büyük", "bu format açılmıyor", "PDF'i birleştirmem lazım". Talep çok yüksek ve **tamamen tarayıcıda çözülebilir**. Bugünkü çözümler (online dönüştürücüler) ise kullanıcının özel belgelerini sunucuya yüklüyor ve bu sitelerde sızıntılar yaşandı.

**Karar:** 3. küme. Çözmesi en kolay olanı bu, talebi en yüksek olanlardan biri ve mevcut çözümlerin ciddi bir gizlilik açığı var. Ortaya çıkan ürün **FileFit**: sunucusuz, internetsiz çalışan, gizliliği tarayıcı tarafından zorunlu kılınan bir dosya araç kutusu.

## 1. Kullanıcılar zamanını nereye kaybediyor?

| Bulgu | Kaynak |
| --- | --- |
| İnsanlar zamanlarının **%20'ye kadarını** bilgisayar sorunlarına harcıyor. En sık sorunlar: sistemin yavaşlaması, geçici donma, çökme ve **"bir şeyi bulmanın zor olması"**. | Kopenhag Üniversitesi ve Roskilde Üniversitesi çalışması ([EurekAlert](https://www.eurekalert.org/news-releases/994165), [SciTechDaily](https://scitechdaily.com/new-study-we-are-wasting-up-to-20-percent-of-our-time-on-computer-problems/)) |
| Çalışanlar dosya, e-posta ve bağlantı aramaya **haftada 4,5 saat** harcıyor (yılda 29 iş günü). Windows kullanıcıları Mac kullanıcılarından haftada 1 saat fazla kaybediyor. Neredeyse yarısı sırf dosya düzenlemek gerektiği için işleri erteliyor. | Smallpdf, 1.005 ABD çalışanıyla anket ([rapor](https://smallpdf.com/blog/digital-declutter-report)) |
| Bilgi aramak ve toplamak günde **1,8 saat** (haftada 9,3 saat) sürüyor. | McKinsey Global Institute, 2012 ([özet](https://www.m-files.com/blog/articles/how-long-does-it-actually-take-to-find-a-document-dissecting-the-many-stats-out-there/)) |
| Ortalama kullanıcı uygulamalar ve siteler arasında **günde ~1.200 kez** geçiş yapıyor. Bu da haftada ~4 saat, yani çalışma zamanının %9'u ediyor. | Harvard Business Review, 2022: 3 Fortune 500 şirketinden 137 kullanıcı ([özet](https://canadianunderwriter.ca/2022/08/31/how-much-time-you-waste-toggling-between-applications/)) |
| BT profesyonellerine göre işlerini en çok aksatan şey **kullanıcı hatası** (%33). Ardından şüpheli linke tıklama (%14), güncellemeleri atlamak (%12) ve zayıf/unutulan parolalar (%11) geliyor. | SolarWinds, 2025, 437 BT profesyoneli ([SecurityBrief](https://securitybrief.co.uk/story/user-error-named-top-it-problem-as-survey-reveals-odd-mishaps)) |

## 2. Gündelik dosya işlerinin büyüklüğü

Bu ihtiyaç çok yaygın ama "sorun" diye pek konuşulmuyor. Talebi trafik ve arama hacmi verilerinden görebiliyoruz:

- **iLovePDF** ayda ~226 milyon ziyaret alıyor (Semrush, Ocak 2026). **Smallpdf** ayda 40 milyonun üzerinde kullanıcı olduğunu söylüyor ([Smallpdf](https://smallpdf.com/nl/about)). pdf24.org ~17 milyon, online-convert.com ~10 milyon ziyaret alıyor.
- **"heic to jpg"** tek başına ayda ~246.000 kez aranıyor, "convert heic to jpg" ise ~60.500 kez (Semrush, 2025). Sebebi basit: iPhone fotoğrafları Windows'ta ve birçok sitede açılmıyor.
- Resmî ve kurumsal formlar (e-Devlet, ÖSYM, vize, iş başvurusu, üniversite) neredeyse her zaman **dosya boyutu sınırı** koyuyor (100–500 KB, 1–2 MB). Telefon fotoğrafları ise 2–5 MB.

## 3. Mevcut çözümlerin sorunu: gizlilik

- Cybernews araştırmacıları iki online PDF servisinin (PDF Pro ve Help PDF) **89.000'den fazla kullanıcı belgesini** korumasız bıraktığını buldu. Belgeler arasında pasaport, ehliyet, sözleşme ve sertifikalar vardı ([BGR](https://bgr.com/tech/online-pdf-converters-leaked-thousands-of-user-uploaded-documents/), [it-daily](https://www.it-daily.net/en/it-security-en/data-protection-grc-en/popular-pdf-tools-expose-user-data)).
- "Dosyalar 1 saat sonra silinir" vaadi bile o süre içinde risk bırakıyor. Bazı araçların dosyaları vaat edilen sürenin çok ötesinde sakladığı bildirildi.
- Fotoğraflar e-posta ya da mesajla gönderildiğinde **EXIF verisi (GPS konumu dahil) dosyayla birlikte gidiyor** ([Consumer Reports](https://int.wlos.com/news/consumer-reports/consumer-reports-do-your-photos-put-your-privacy-at-risk-04-25-2019)). Bazı sosyal ağlar bunu siliyor, birçok kanal silmiyor ([InformationWeek](https://www.informationweek.com/it-leadership/facebook-stalking-fears-6-geotagging-facts)).

## 4. Rakip analizi

| Ürün | Ne iyi | Eksik |
| --- | --- | --- |
| iLovePDF, Smallpdf, TinyPNG, online dönüştürücüler | Kolay, bilinen | Dosyaları sunucuya yüklüyor; reklam, limit ve ücretli sürüm var |
| [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) (~95 bin ⭐) | Çok güçlü PDF araçları | Sunucu/Docker kurulumu gerekiyor, sıradan kullanıcıya göre değil, resim işleri yok |
| [BentoPDF](https://github.com/alam00000/bentopdf) (~16 bin ⭐) | Tarayıcıda çalışan PDF araçları | Sadece PDF; boyut hedefleme, HEIC ve metadata temizleme yok |
| Squoosh (Google) | Kaliteli tek resim sıkıştırma | Tek dosya, hedef boyut yok, HEIC yok, PDF yok |
| Caesium, ImageOptim | Masaüstü toplu sıkıştırma | Kurulum gerekiyor, platforma bağlı |

Yıldız sayıları gösteriyor ki **"gizlilik öncelikli, yerelde çalışan" araçlar GitHub'da çok takdir görüyor**. Yine de sıradan kullanıcının günlük işlerini (boyut sınırı + HEIC + PDF + konum temizleme) **tek yerde, kurulumsuz** çözen bir proje yok.

## 5. Sorunları puanlama

| Sorun | Yaygınlık | Küçük bir açık kaynak uygulamayla çözülebilir mi? | Rekabet |
| --- | --- | --- | --- |
| Yavaşlık, donma | Çok yüksek | Hayır (donanım/işletim sistemi) | – |
| Dosya bulma, dağınıklık | Yüksek | Kısmen, işletim sistemi entegrasyonu gerekir | Spotlight, Everything |
| Uygulama geçişi, dikkat dağınıklığı | Yüksek | Zor, davranışsal | Çok sayıda odak uygulaması |
| Parola/güvenlik | Yüksek | Riskli, güven inşası çok zor | Bitwarden, 1Password |
| **Dosya çok büyük / yanlış format / PDF birleştirme** | **Çok yüksek** | **Evet, tamamen tarayıcıda** | Online siteler (gizlilik sorunu) |
| **Fotoğraflardaki gizli konum** | Yaygın, farkındalık düşük | **Evet** | Dağınık, tek amaçlı araçlar |

## 6. Ürün kararı: FileFit

**İlkeler:** kurulumsuz (bir link), sunucusuz, internetsiz, gizliliği kanıtlanabilir.

- **Boyuta sığdır:** "200 KB'ın altına indir" gibi en yaygın derdi tek tıkla çözer. Kaliteyi ikili aramayla optimize eder; gerekirse çözünürlüğü düşürür.
- **Dönüştür:** HEIC → JPG başta olmak üzere tüm yaygın formatlar.
- **PDF oluştur:** PDF ve fotoğrafları sıralayıp tek PDF yapar.
- **Gizli bilgileri sil:** GPS, kamera, tarih ve yazar bilgisini gösterir ve kayıpsız siler.
- **Güven:** sıkı CSP (`connect-src 'self'`) sayesinde sayfa dosyaları teknik olarak dışarı gönderemez. Bu iddia tarayıcının geliştirici araçlarıyla doğrulanabilir.
- **Yayın:** GitHub Pages üzerinde ücretsiz. Her push'ta testler çalışır, site otomatik yayınlanır.

**Neden takdir görür:** herkesin ihtiyacı olan bir şey; "dosyalarım nereye gidiyor?" kaygısına somut bir cevap veriyor; tek link ile kullanılıyor; kod küçük, okunur ve test edilmiş; yeni dil eklemek kolay. Bu da katkı almayı kolaylaştırıyor.

## Yöntem notu

Veriler web aramasıyla toplandı. Bazı rakamlar üretici anketlerine (Smallpdf) veya üçüncü taraf trafik tahminlerine (Semrush) dayanıyor; bu yüzden kesin değil, büyüklük göstergesi olarak okunmalı. McKinsey ve IDC verileri eski (2012) ama sonraki anketlerle aynı yönde.
