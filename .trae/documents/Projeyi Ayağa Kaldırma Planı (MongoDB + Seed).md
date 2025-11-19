## Amaç
Projeyi yerel ortamda çalışır hale getirmek: MongoDB’yi başlatmak, koleksiyon/indeksleri kurmak ve `playground-1.mongodb.js` seed dosyasını çalıştırmak. Ardından veritabanı doğrulaması ve (opsiyonel) Mongo Express ile görsel inceleme.

## Ön Koşullar
- macOS üzerinde Docker Desktop veya yerel MongoDB (`mongosh`) kurulu olmalı.
- Proje klasörü: `/Users/ugurertik/Documents/trae_projects/Trae otomasyon denemesi/`
- Seed dosyası: `playground-1.mongodb.js` (MongoDB Playground/mongosh ile uyumlu).

## Seçenek A: Docker Compose ile MongoDB
1. Proje dizinine bir `docker-compose.yml` ekleyelim (MongoDB 6 + Mongo Express):
   - Servisler: `mongo` (port `27017`), `mongo-express` (port `8081`).
   - Varsayılan veritabanı: `dental_automation`.
2. Çalıştırma komutları:
   - `docker compose up -d`
   - Durum kontrolü: `docker compose ps`
3. Seed dosyasını çalıştırma:
   - Kapsayıcı içine bağlan: `docker exec -it <mongo_container> mongosh --file /work/playground-1.mongodb.js`
   - Alternatif: Dosyayı kapsayıcıya kopyala: `docker cp playground-1.mongodb.js <mongo_container>:/work/` ve ardından `mongosh --file /work/playground-1.mongodb.js`.

## Seçenek B: Yerel MongoDB ile
1. Kurulum (Homebrew):
   - `brew install mongosh`
   - (Mongo Sunucusu gerekiyorsa) `brew tap mongodb/brew && brew install mongodb-community@6.0 && brew services start mongodb-community@6.0`
2. Seed dosyasını çalıştırma:
   - `mongosh --file playground-1.mongodb.js`
   - Varsayılan olarak `use('dental_automation')` ile veritabanı seçilir.

## Seed İçeriği ve Varsayımlar
- Koleksiyonlar: `Users, Roles, Clinics, Branches, Patients, Appointments, TreatmentPlans, Treatments, Payments, Invoices, StockItems, StockTransactions, Files, Notes, AuditLogs`.
- İndeksler: E-posta ve TCKN unique/sparse, tarih ve ilişki alanlarında sorgu indeksleri.
- Validatörler: Temel şema doğrulaması (jsonSchema) ve enum benzeri metin alanları.
- Örnek veriler: 1 klinik, 1 şube, Admin/Doctor kullanıcı, 1 hasta, 1 randevu, 1 plan, 2 tedavi, 1 fatura, 1 ödeme, 1 stok ve işlem, 1 not, 1 audit.
- İdempotans: İndeks ve unique alanlar sayesinde tekrar çalıştırmada çakışma uyarısı alabilirsiniz; planlı kullanım tek seferdir.

## Doğrulama Adımları
1. Koleksiyonlar listesi:
   - `mongosh` içinde: `show collections`
2. Hastadan örnek kayıt doğrulama:
   - `db.Patients.findOne({}, {full_name:1, email:1, clinic_id:1, branch_id:1})`
3. Randevu indeks kontrolü:
   - `db.Appointments.getIndexes()` → `doctor_id,start` ve `branch_id,start` indekslerini içermeli.
4. Fatura benzersiz numara:
   - `db.Invoices.findOne({number: 'INV-2025-001'})`
5. Stok kritik uyarı durumu senaryosu:
   - `db.StockItems.find({current_level: {$lt: "$min_level"}})` (beklenen kayıt 1).

## Mongo Express (Opsiyonel)
- URL: `http://localhost:8081`
- Tabloları ve verileri web arayüzünden görüntüle.

## No-Code Platform Bağlama (Kısaca)
- Bubble: `API Connector` ile REST API katmanı veya doğrudan App Data yerine external DB proxy.
- Glide: Collections → dış kaynak (REST) bağlayıcı; kimlik doğrulama header’ları.
- Softr: Airtable veya REST Data Source; bu MongoDB’yi bir ara API ile sunma.
- Flutterflow: API Calls → endpoint şemaları; pagination ve auth ekle.

## Riskler ve Notlar
- Unique indeksler nedeniyle seed dosyası tekrarlı çalıştırılırsa ekleme hataları alabilirsiniz.
- Zaman dilimi: Tarih alanlarında UTC kullanılıyor; yerel gösterim katmanda dönüştürülmeli.
- Güvenlik: Üretimde kullanıcı ve şifre gereklidir; bu plan yerel geliştirme içindir.

## Onay Sonrası Uygulama
- Seçtiğiniz seçenek (A veya B) ile kurulum komutlarını çalıştıracağım.
- Seed dosyasını uygular ve doğrulama sorgularını çalıştırırım.
- İsterseniz Mongo Express’i ekleyip görsel doğrulama sağlarım.
- Son aşamada no-code platformlar için API uçlarını hazırlayıp bağlantı testlerini yaparım.