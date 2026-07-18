# Spesifikasi Desain UI BESUREK (Bilik Edukasi, Simulasi, dan Rekomendasi)

Dokumen ini mendokumentasikan spesifikasi, prinsip, dan kustomisasi desain antarmuka (UI) untuk aplikasi **BESUREK** BPS Kabupaten Kepahiang yang diterapkan pada halaman [Welcome.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/pages/Welcome.vue).

---

## 1. Prinsip Desain Utama

- **Clean & Minimalis Modern**: Menghindari elemen visual yang berlebihan seperti bayangan tebal (_heavy shadows_), warna gradasi (_gradients_), serta border/garis yang bertumpuk secara tidak perlu.
- **Warna Semantik & Dinamis**: Seluruh elemen warna (teks, batas, latar belakang) terikat sepenuhnya pada variabel semantik CSS Tailwind dan sistem preset PrimeVue. Tidak ada nilai warna yang di-_hardcode_ di dalam markup HTML.
- **Flat UI Layout**: Menghilangkan kedalaman semu untuk memberikan nuansa datar yang rapi, bersih, dan mewah.

---

## 2. Tipografi (Typography)

- **Sanskrit Utama (Body & UI)**: `Plus Jakarta Sans` (Sans-serif yang modern, bersih, dan sangat mudah dibaca).
- **Heading Hero Aksentuasi**: `JetBrains Mono` (Font monospaced bergaya developer yang disuntikkan secara dinamis dari Google Fonts untuk memberikan kesan presisi, teknis, dan elegan).
    - Kelas target: `.font-jetbrains`
    - Spesifikasi: `font-family: 'JetBrains Mono', monospace !important; letter-spacing: -0.03em !important;`

---

## 3. Sistem Palet Warna Aksen Dinamis

Aplikasi menyediakan konfigurator tema terapung yang memungkinkan User mengubah aksen utama secara langsung. Palet warna primer ini dipetakan ke HSL semantik dan disinkronkan langsung ke preset PrimeVue v4:

| Nama Warna          | HSL Light Mode     | HSL Dark Mode      | Pemetaan Preset PrimeVue |
| :------------------ | :----------------- | :----------------- | :----------------------- |
| **Hitam (Black)**   | `hsl(0 0% 0%)`     | `hsl(0 0% 100%)`   | `zinc`                   |
| **Biru (Blue)**     | `hsl(214 62% 27%)` | `hsl(217 91% 60%)` | `blue`                   |
| **Hijau (Green)**   | `hsl(142 76% 24%)` | `hsl(142 76% 42%)` | `emerald`                |
| **Orange (Orange)** | `hsl(24 90% 50%)`  | `hsl(24 95% 60%)`  | `orange`                 |
| **Ungu (Purple)**   | `hsl(263 70% 50%)` | `hsl(263 85% 65%)` | `purple`                 |
| **Pink (Pink)**     | `hsl(322 81% 54%)` | `hsl(322 90% 65%)` | `pink`                   |
| **Merah (Red)**     | `hsl(346 84% 50%)` | `hsl(346 87% 60%)` | `red`                    |

---

## 4. Kustomisasi Komponen PrimeVue v4

Semua komponen menggunakan pembungkus asli (native) dari PrimeVue v4 dengan memanfaatkan gaya bawaan dari tema preset Aura yang bersih dan dinamis:

### A. Komponen Tabs & Accordion

- **Default PrimeVue Styling**: Seluruh komponen Tabs dan Accordion menggunakan gaya default bawaan tema PrimeVue Aura. Tidak ada berkas stylesheet kustom maupun kustomisasi CSS manual yang menimpa kelas internal PrimeVue, sehingga desain tetap konsisten dan terintegrasi secara murni dengan siklus hidup PrimeVue.
- **Integrasi Warna Aksen**: Latar belakang, batas (_borders_), status hover, aktif, dan transisi ikon chevron sepenuhnya diatur secara otomatis dan semantik berdasarkan pilihan warna aksen dinamis (`activeColor`) via fungsi `updatePreset` dari PrimeVue.

### B. Komponen Buttons

- **Native & Semantic Styling**: Menghapus seluruh kelas kustom Tailwind (`bg-primary`, `hover:bg-primary/95`, dll.) dari atribut kelas tombol.
- **Automatic Theme Integration**: Dengan membiarkan tombol dirender secara standar oleh PrimeVue, tombol secara otomatis mendeteksi perubahan palet aksen primer dari preset dinamis, menciptakan interaksi hover, active, dan focus yang selaras tanpa kode tambahan.
- **Loading Spinner (Inside Button)**: Saat tombol submit diklik dan sedang memproses data (`processing` bernilai true), gunakan properti bawaan tombol `:loading="processing"` agar PrimeVue secara otomatis menyematkan ikon spinner yang rapi di dalam tombol tersebut.

### C. Komponen Form & Inputs

- **PrimeVue Form Controls**: Setiap kontrol form yang memungkinkan (seperti Dropdown/Select, Calendar/DatePicker, InputText, InputNumber, dll.) wajib menggunakan komponen bawaan PrimeVue v4 (contoh: `<Select>` dari `primevue/select`) untuk menjaga konsistensi visual Aura preset dan transisi warna aksen semantik yang rapi.

### D. Komponen Notifikasi (Toast)

- **System-wide Toast**: Seluruh sistem notifikasi (termasuk flash message dari backend) wajib menggunakan komponen Toast dari PrimeVue (`ToastService` dan `<Toast />`).
- **ToastEventBus Integration**: Untuk memicu notifikasi dari luar siklus hidup komponen Vue (seperti di helper JavaScript/TypeScript), gunakan `ToastEventBus` dari `'primevue/toasteventbus'` dengan event `'add'` untuk menyelaraskan notifikasi dengan sistem tema PrimeVue Aura.

### E. Komponen Tabel (DataTable)

- **PrimeVue DataTable**: Seluruh tabel di dalam aplikasi wajib menggunakan komponen tabel bawaan PrimeVue v4 (`<DataTable>` dan `<Column>`) untuk menjaga konsistensi UI.
- **Striped Rows**: Setiap `<DataTable>` wajib menyertakan properti `stripedRows` agar baris tabel memiliki warna selang-seling (striping) secara otomatis sesuai preset Aura, guna meningkatkan keterbacaan data.
- **Kolom Nomor Urut (No.)**: Setiap tabel wajib memiliki kolom nomor urut pada kolom pertama dengan judul `No.` yang rata tengah (`text-center`) dan lebar kolom yang kecil (misal: `w-12`). Gunakan templat slot `#body` untuk menampilkan nomor urut dinamis berdasarkan index:
    ```html
    <Column header="No." class="p-3 text-center w-12 text-muted-foreground text-xs">
        <template #body="slotProps">
            {{ slotProps.index + 1 }}
        </template>
    </Column>
    ```
- **Pemisahan Filter Section**: Filter section (termasuk filter dropdowns, input pencarian, dll.) dilarang digabungkan di dalam card/container tabel. Filter section wajib diletakkan dalam card/container mandiri yang terpisah tepat di atas card tabel.
- **Tanpa Judul Tabel**: Di dalam card tabel, tidak diperkenankan menambahkan judul daftar (seperti "Daftar User", dll.) agar struktur layout tetap bersih, minimalis, dan terfokus langsung pada presentasi data tabel.
- **Tipografi Kolom (Header vs Body)**: Seluruh judul kolom (headers) wajib menggunakan font `Plus Jakarta Sans` (`font-sans`) dengan ukuran seragam yang sama (yaitu `xs` atau `0.75rem`), sedangkan isi/data sel di dalam body tabel wajib menggunakan font `JetBrains Mono` (`font-jetbrains` atau `font-mono`) untuk keterbacaan data teknis yang lebih optimal. Hal ini diatur secara terpusat di dalam berkas CSS global.

### F. Dialog & Konfirmasi (Dialogs)

- **No Native Browser Confirm**: Dilarang menggunakan fungsi bawaan browser `confirm()` untuk meminta konfirmasi tindakan penting (seperti menghapus atau menonaktifkan data). Hal ini merusak estetika antarmuka modern.
- **Custom PrimeVue Dialog**: Wajib menggunakan komponen `<Dialog>` dari PrimeVue yang dikustomisasi dengan gaya rounded, border, dan tombol yang konsisten dengan tema desain sistem BESUREK.
- **Autofocus Tombol Batal/Tutup (Enter-to-Close)**: Di setiap modal/dialog, tombol pembatalan atau penutup (misal tombol "Batal", "Tutup", atau "Cancel") wajib diberi atribut `autofocus` agar ketika modal tersebut tampil, fokus keyboard secara otomatis langsung mengarah ke tombol penutup tersebut. Hal ini memungkinkan pengguna langsung menekan tombol `Enter` untuk menutup dialog secara instan.

### G. Komponen Paginator (Pagination)

- **Tabel Paginator**: Untuk pagination di dalam komponen tabel, gunakan properti bawaan `<DataTable>` seperti `:paginator="true"`, `:rows="10"`, dan `:rowsPerPageOptions="[10, 20, 50, 100]"` untuk meminimalkan kompleksitas kode.
- **Paginator Mandiri (Standalone)**: Untuk pagination halaman/konten non-tabel, gunakan komponen `<Paginator>` dari PrimeVue:
    ```html
    <Paginator :rows="10" :totalRecords="120" :rowsPerPageOptions="[10, 20, 50, 100]"></Paginator>
    ```

### H. Bungkus Chip MultiSelect & Lebar Modal (MultiSelect Chips & Dialog Width)

- **Pembungkusan Chip MultiSelect**: Untuk input yang menggunakan `<MultiSelect>` dengan tampilan chip (`display="chip"`), wajib dipastikan bahwa chip-chip pilihan membungkus secara vertikal (`flex-wrap: wrap`) dan tidak meluap secara horizontal ke luar batas input. Kustomisasi ini diterapkan secara global di berkas CSS.
- **Lebar Modal Form Kompleks**: Untuk modal form yang memiliki banyak field input, range tanggal, atau file upload (seperti form Kegiatan Statistik atau Pembinaan), disarankan menggunakan lebar maksimal `max-w-2xl` agar memberikan ruang tata letak grid dan chip pilihan yang lebih lega dan rapi.

---

## 5. Arsitektur SPA (Single Page Application) Layout

Untuk mendukung skalabilitas aplikasi bertipe Single Page Application (SPA), struktur layout dipisahkan agar Header dan Footer dapat digunakan kembali (_reusable_) di seluruh halaman publik tanpa melakukan render ulang komponen secara redundant:

### A. Layout Utama (`GuestLayout.vue`)

- Lokasi: [GuestLayout.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/layouts/GuestLayout.vue)
- Tanggung Jawab: Menyediakan kerangka halaman publik dengan membungkus konten utama (`<slot />`) di antara `GuestHeader` dan `GuestFooter`, serta mengelola sinkronisasi warna aksen dinamis secara global.

### B. Komponen Header Publik (`Header.vue`)

- Lokasi: [Header.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/components/Guest/Header.vue)
- Sub-komponen pendukung di dalam folder `components/Guest/`:
    1.  [Logo.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/components/Guest/Logo.vue): Elemen visual branding logo BPS.
    2.  [Navigation.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/components/Guest/Navigation.vue): Navigasi navigasi utama berorientasi anchor/routing.
    3.  [ThemeSwitcher.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/components/Guest/ThemeSwitcher.vue): Selector mode gelap/terang serta tombol pengganti warna aksen dinamis.
    4.  [AuthActions.vue](file:///Users/user/Documents/01%20-%20Skill%20Improve/Laravel/Laravel13/Besurek/resources/js/components/Guest/AuthActions.vue): Tombol CTA autentikasi (Masuk, Daftar, atau Dashboard).
