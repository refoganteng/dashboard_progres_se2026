    
      // ================= KONFIGURASI =================
      const CONFIG = {
        NAMA_KABUPATEN: "Kepahiang", // Ganti dengan nama kabupaten Anda
        TARGET_PER_HARI_PPL: 7 // Target jumlah assignment harian per PPL
      };

      const formatNumber = (num) => num.toLocaleString('id-ID');
      const formatPercent = (num) => num.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

      document.addEventListener("DOMContentLoaded", () => {
        document.title = `Dashboard Progres SE2026 BPS ${CONFIG.NAMA_KABUPATEN}`;
        document.querySelectorAll(".kabupaten-name").forEach(el => {
          el.textContent = CONFIG.NAMA_KABUPATEN;
        });
        document.querySelectorAll(".target-per-hari-text").forEach(el => {
          el.textContent = CONFIG.TARGET_PER_HARI_PPL;
        });
      });
      // ===============================================

      // State Application
      let database = [];
      let currentUser = null; // { role, name, emailOrCode }
      let activeLoginTab = "petugas";

      // Pagination States (10 items / page)
      const pageSize = 8;
      let pplCurrentPage = 1;
      let adminCurrentPage = 1;

      window.onload = function () {
        refreshData();
      };

      function refreshData() {
        const syncIcon = document.getElementById("sync-icon");
        if (syncIcon) syncIcon.classList.add("animate-spin");

        google.script.run
          .withSuccessHandler(function (response) {
            if (response.success) {
              database = response.data;

              // Jika ada user aktif, re-render dashboard dengan data baru
              if (currentUser) {
                renderDashboard();
              }
            } else {
              showError("Gagal mengambil data: " + response.message);
            }
            showLoading(false);
            if (syncIcon) syncIcon.classList.remove("animate-spin");
          })
          .withFailureHandler(function (err) {
            showError("Gagal terhubung dengan server: " + err.toString());
            showLoading(false);
            if (syncIcon) syncIcon.classList.remove("animate-spin");
          })
          .getSheetData();
      }

      function showLoading(status) {
        const loader = document.getElementById("loading");
        if (status) {
          loader.classList.remove("hidden");
          loader.classList.add("flex");
        } else {
          loader.classList.add("hidden");
          loader.classList.remove("flex");
        }
      }

      function showError(msg) {
        const box = document.getElementById("alert-box");
        const message = document.getElementById("alert-message");
        message.textContent = msg;
        box.classList.remove("hidden");
        setTimeout(() => {
          closeAlert();
        }, 5000);
      }

      function closeAlert() {
        document.getElementById("alert-box").classList.add("hidden");
      }

      // Login Tab Controller
      function switchLoginTab(tab) {
        activeLoginTab = tab;
        const btnPetugas = document.getElementById("btn-tab-petugas");
        const btnAdmin = document.getElementById("btn-tab-admin");
        const formPetugas = document.getElementById("form-petugas");
        const formAdmin = document.getElementById("form-admin");

        if (tab === "petugas") {
          btnPetugas.className =
            "py-2.5 text-sm font-medium rounded-lg transition-all bg-white text-blue-900 shadow-sm";
          btnAdmin.className =
            "py-2.5 text-sm font-medium rounded-lg transition-all text-slate-600 hover:text-slate-900";
          formPetugas.classList.remove("hidden");
          formAdmin.classList.add("hidden");
        } else {
          btnAdmin.className =
            "py-2.5 text-sm font-medium rounded-lg transition-all bg-white text-blue-900 shadow-sm";
          btnPetugas.className =
            "py-2.5 text-sm font-medium rounded-lg transition-all text-slate-600 hover:text-slate-900";
          formAdmin.classList.remove("hidden");
          formPetugas.classList.add("hidden");
        }
      }

      // Handle Login authentication
      function handleLogin() {
        if (activeLoginTab === "petugas") {
          const emailInput = document
            .getElementById("input-email")
            .value.trim()
            .toLowerCase();
          if (!emailInput) {
            showError("Harap masukkan email terlebih dahulu.");
            return;
          }

          // Cari di database apakah sebagai PPL
          const pplMatches = database.filter((r) => r.emailPpl === emailInput);
          if (pplMatches.length > 0) {
            currentUser = {
              role: "PPL",
              name: pplMatches[0].pplName,
              emailOrCode: emailInput,
            };
            transitionToDashboard();
            return;
          }

          // Cari di database apakah sebagai PML
          const pmlMatches = database.filter((r) => r.emailPml === emailInput);
          if (pmlMatches.length > 0) {
            currentUser = {
              role: "PML",
              name: pmlMatches[0].pmlName,
              emailOrCode: emailInput,
            };
            transitionToDashboard();
            return;
          }

          showError(
            "Email tidak terdaftar sebagai PPL atau PML. Pastikan penulisan sudah benar.",
          );
        } else {
          // Admin login
          const codeInput = document.getElementById("input-code").value.trim();
          if (codeInput === "admin1708") {
            currentUser = {
              role: "Admin",
              name: "Administrator",
              emailOrCode: "admin1708",
            };
            transitionToDashboard();
          } else {
            showError("Kode akses admin salah. Silakan coba lagi.");
          }
        }
      }

      function transitionToDashboard() {
        showLoading(true);
        document.getElementById("view-login").classList.add("hidden");
        document.getElementById("view-dashboard").classList.remove("hidden");

        // Update Navbar User Info
        document.getElementById("nav-user-name").textContent = currentUser.name;
        document.getElementById("nav-user-role").textContent = currentUser.role;
        document.getElementById("welcome-message").textContent =
          `Selamat Datang, ${currentUser.name}!`;

        // Setup Evaluasi Kemarin Info
        const startDate = new Date("2026-06-15T00:00:00");
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today < startDate || today > new Date("2026-07-31T00:00:00")) {
          today = new Date("2026-06-23T00:00:00");
        }
        const diffTime = today - startDate;
        const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        
        const targetCumulativeYesterday = (daysElapsed > 1 ? daysElapsed - 1 : 1) * CONFIG.TARGET_PER_HARI_PPL;
        const hariStr = daysElapsed > 1 ? `Hari ke-${daysElapsed - 1}` : `Hari ke-1`;
        
        document.getElementById("header-kemarin-hari").textContent = hariStr;
        document.getElementById("header-kemarin-tanggal").textContent = yesterdayStr;
        document.getElementById("header-kemarin-target").textContent = targetCumulativeYesterday;

        // Reset Halaman Pagination
        pplCurrentPage = 1;
        adminCurrentPage = 1;

        renderDashboard();

        // Loading dimatikan setelah data siap (atau setelah timeout jika data sudah ada)
        if (database.length > 0) {
          setTimeout(() => showLoading(false), 600);
        }
        // Jika data belum siap, showLoading(false) akan dipanggil oleh callback refreshData
      }

      function handleLogout() {
        currentUser = null;
        document.getElementById("view-dashboard").classList.add("hidden");
        document.getElementById("view-login").classList.remove("hidden");
        // Clear inputs
        document.getElementById("input-email").value = "";
        document.getElementById("input-code").value = "";
      }

      // ROUTER RENDERER UTAMA DASHBOARD
      function renderDashboard() {
        // Sembunyikan semua panel dulu
        document.getElementById("panel-ppl").classList.add("hidden");
        document.getElementById("panel-pml").classList.add("hidden");
        document.getElementById("panel-admin").classList.add("hidden");

        if (currentUser.role === "PPL") {
          renderPPLDashboard();
        } else if (currentUser.role === "PML") {
          renderPMLDashboard();
        } else if (currentUser.role === "Admin") {
          renderAdminDashboard();
        }
      }

      // ================= IMPLEMENTASI PPL DASHBOARD =================
      let currentPPLWilayahData = [];

      function renderPPLDashboard() {
        document.getElementById("panel-ppl").classList.remove("hidden");

        // Filter wilayah tugas PPL aktif
        currentPPLWilayahData = database.filter(
          (r) => r.emailPpl === currentUser.emailOrCode,
        );

        // Hitung aggregasi statistik
        let totalAssignment = 0;
        let totalOpen = 0;
        let totalDraft = 0;
        let totalSubmittedPencacah = 0;
        let totalSubmittedRespondent = 0;
        let totalApproved = 0;
        let totalRejected = 0;

        currentPPLWilayahData.forEach((row) => {
          totalAssignment += row.totalSekarang;
          totalOpen += row.open;
          totalDraft += row.draft;
          totalSubmittedPencacah += row.submittedPencacah;
          totalSubmittedRespondent += row.submittedRespondent;
          totalApproved += row.approved;
          totalRejected += row.rejected;
        });

        const totalProgress =
          totalSubmittedPencacah +
          totalSubmittedRespondent +
          totalApproved +
          totalRejected;

        // Update basic cards
        document.getElementById("ppl-total-assignment").textContent =
          totalAssignment;
        document.getElementById("ppl-progress-total").innerHTML =
          `${totalProgress} <span class="text-sm text-slate-400 font-medium">/ ${totalAssignment} Assignment</span>`;

        // Update ring progress
        const percent =
          totalAssignment > 0
            ? ((totalProgress / totalAssignment) * 100).toFixed(2)
            : "0.00";
        document.getElementById("ppl-progress-percent").textContent =
          `${percent}%`;

        const strokeDashoffset = 238.76 - (238.76 * percent) / 100;

        // Hitung peringkat PPL
        const pplScores = {};
        database.forEach((row) => {
          const key = row.emailPpl;
          if (!key) return;
          if (!pplScores[key]) {
            pplScores[key] = { email: row.emailPpl, progress: 0 };
          }
          pplScores[key].progress +=
            row.submittedPencacah +
            row.submittedRespondent +
            row.approved +
            row.rejected;
        });
        const pplSorted = Object.values(pplScores).sort(
          (a, b) => b.progress - a.progress,
        );
        const myRank =
          pplSorted.findIndex((p) => p.email === currentUser.emailOrCode) + 1;
        document.getElementById("ppl-rank").textContent =
          `#${myRank} / ${pplSorted.length}`;
        document
          .getElementById("ppl-progress-circle")
          .setAttribute("stroke-dashoffset", strokeDashoffset);

        // Hitung Evaluasi Target Harian
        // Sensus mulai 15 Juni 2026.
        const startDate = new Date("2026-06-15T00:00:00");
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        // Simulasi/Lock target jika tanggal melebihi batas demo
        if (today < startDate || today > new Date("2026-07-31T00:00:00")) {
          today = new Date("2026-06-23T00:00:00"); // Gunakan tanggal referensi sistem (Hari ke-9)
        }

        const diffTime = today - startDate;
        const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const targetBadge = document.getElementById("ppl-target-badge");
        const targetAdvice = document.getElementById("ppl-target-advice");

        if (daysElapsed > 1) {
          const targetCumulativeYesterday = (daysElapsed - 1) * CONFIG.TARGET_PER_HARI_PPL;
          const targetCumulativeToday = daysElapsed * CONFIG.TARGET_PER_HARI_PPL;

          if (totalProgress >= targetCumulativeYesterday) {
            targetBadge.className =
              "inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-4 bg-emerald-100 text-emerald-800 border border-emerald-300";
            targetBadge.textContent = "Mencapai Target ✅";
            targetAdvice.innerHTML = `Hari ini adalah <strong>Hari Ke-${daysElapsed}</strong>. Progres kumulatif Anda kemarin terkumpul <strong>${totalProgress} assignment</strong> (melampaui target kemarin: ${targetCumulativeYesterday} assignment). <br><span class="text-emerald-600 font-bold block mt-2">Keren, semangat yok hari ini tambah 7 target lagi ya! :)</span>`;
          } else {
            const shortageForToday = targetCumulativeToday - totalProgress;
            targetBadge.className =
              "inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-4 bg-rose-100 text-rose-800 border border-rose-300";
            targetBadge.textContent = "Belum Capai Target ⚠️";
            targetAdvice.innerHTML = `Hari ini adalah <strong>Hari Ke-${daysElapsed}</strong>. Progres kumulatif Anda kemarin terkumpul <strong>${totalProgress} assignment</strong> (di bawah target minimal kemarin: ${targetCumulativeYesterday} assignment). <br><span class="text-rose-600 font-bold block mt-2">Waduh, kamu harus submit minimal ${shortageForToday} assignment hari ini biar ngejar ketertinggalan target kumulatif!</span>`;
          }
        } else if (daysElapsed === 1) {
          targetBadge.className =
            "inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-4 bg-blue-100 text-blue-800 border border-blue-300";
          targetBadge.textContent = "Hari Pertama Sensus 🚀";
          targetAdvice.textContent =
            "Sensus Ekonomi 2026 dimulai hari ini! Target harian Anda adalah 7 assignment terkumpul. Tetap semangat dan jaga kualitas data!";
        } else {
          targetBadge.className =
            "inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-4 bg-slate-100 text-slate-800 border border-slate-300";
          targetBadge.textContent = "Belum Dimulai";
          targetAdvice.textContent =
            "Pencacahan Sensus Ekonomi 2026 baru akan dimulai pada tanggal 15 Juni 2026.";
        }

        // Tampilkan Peringatan PPL jika memenuhi kriteria
        const pplWarningEl = document.getElementById("ppl-warning");
        const pplWarningText = document.getElementById("ppl-warning-text");
        let warnings = [];
        if (totalDraft > 20) {
           warnings.push("Anda memiliki lebih dari 20 dokumen bersatus Draft.");
        }
        if (daysElapsed > 1) {
           const targetCumulativeYesterday = (daysElapsed - 1) * CONFIG.TARGET_PER_HARI_PPL;
           if ((targetCumulativeYesterday - totalProgress) >= 28) {
              warnings.push("Anda termasuk PPL Progres Rendah (Hutang >= 28 assignment).");
           }
        }

        if (warnings.length > 0) {
           pplWarningEl.classList.remove("hidden");
           pplWarningText.innerHTML = warnings.join("<br>");
        } else {
           pplWarningEl.classList.add("hidden");
        }

        // Render PPL Wilayah Cards
        displayPPLWilayahCards(currentPPLWilayahData);
      }

      // Render PPL wilayah dalam format CARD GRID dengan PAGINATION
      function displayPPLWilayahCards(dataList) {
        const container = document.getElementById("ppl-cards-container");
        container.innerHTML = "";

        if (dataList.length === 0) {
          container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">Tidak ada wilayah kerja yang sesuai kata kunci.</div>`;
          document.getElementById("ppl-page-info").textContent =
            "Halaman 0 dari 0";
          document.getElementById("ppl-prev-btn").disabled = true;
          document.getElementById("ppl-next-btn").disabled = true;
          return;
        }

        const totalPages = Math.ceil(dataList.length / pageSize);
        if (pplCurrentPage > totalPages) pplCurrentPage = totalPages || 1;

        const start = (pplCurrentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedList = dataList.slice(start, end);

        paginatedList.forEach((row) => {
          const submitted = row.submittedPencacah + row.submittedRespondent;
          const totalProgress =
            row.submittedPencacah +
            row.submittedRespondent +
            row.approved +
            row.rejected;
          const percentage =
            row.totalSekarang > 0
              ? ((totalProgress / row.totalSekarang) * 100).toFixed(2)
              : "0.00";

          const card = document.createElement("div");
          card.className =
            "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all";
          card.innerHTML = `
          <div>
            <div class="flex justify-between items-start gap-2 mb-2">
              <h4 class="font-bold text-slate-800 text-sm">${row.wilayah}</h4>
              <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">${formatPercent(parseFloat(percentage))}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1 overflow-hidden mb-4">
              <div class="bg-emerald-500 h-1 rounded-full" style="width: ${percentage}%"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="bg-slate-50 p-2 rounded-lg">
                <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Total Beban</span>
                <span class="font-bold text-slate-700 text-sm">${formatNumber(row.totalSekarang)}</span>
              </div>
              <div class="bg-blue-50 p-2 rounded-lg">
                <span class="text-blue-500 block mb-0.5 text-[10px] font-semibold uppercase">Progres</span>
                <span class="font-bold text-blue-700 text-sm">${formatNumber(totalProgress)}</span>
              </div>
              <div class="bg-indigo-50 p-2 rounded-lg col-span-2 flex justify-around">
                <div>
                  <span class="text-indigo-500 block text-[9px] font-semibold uppercase mb-0.5">Sub</span>
                  <span class="font-bold text-indigo-700 text-xs">${formatNumber(submitted)}</span>
                </div>
                <div>
                  <span class="text-emerald-500 block text-[9px] font-semibold uppercase mb-0.5">App</span>
                  <span class="font-bold text-emerald-700 text-xs">${formatNumber(row.approved)}</span>
                </div>
                <div>
                  <span class="text-rose-500 block text-[9px] font-semibold uppercase mb-0.5">Rej</span>
                  <span class="font-bold text-rose-700 text-xs">${formatNumber(row.rejected)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
          container.appendChild(card);
        });

        document.getElementById("ppl-page-info").textContent =
          `Halaman ${pplCurrentPage} dari ${totalPages}`;
        document.getElementById("ppl-prev-btn").disabled = pplCurrentPage === 1;
        document.getElementById("ppl-next-btn").disabled =
          pplCurrentPage === totalPages;
      }

      function changePPLPage(direction) {
        pplCurrentPage += direction;
        filterPPLWilayah();
      }

      function filterPPLWilayah() {
        const keyword = document
          .getElementById("ppl-search-wilayah")
          .value.toLowerCase()
          .trim();
        const filtered = currentPPLWilayahData.filter((r) =>
          r.wilayah.toLowerCase().includes(keyword),
        );
        displayPPLWilayahCards(filtered);
      }

      // ================= IMPLEMENTASI PML DASHBOARD =================
      let currentPMLPPLList = [];

      function renderPMLDashboard() {
        document.getElementById("panel-pml").classList.remove("hidden");

        // Ambil seluruh baris yang berada di bawah pengawasan PML aktif
        const myTeamData = database.filter(
          (r) => r.emailPml === currentUser.emailOrCode,
        );

        // Kumpulkan keunikan PPL di bawah PML ini
        const pplMap = {};
        myTeamData.forEach((row) => {
          if (!pplMap[row.emailPpl]) {
            pplMap[row.emailPpl] = {
              name: row.pplName,
              email: row.emailPpl,
              totalAssignment: 0,
              open: 0,
              draft: 0,
              submittedPencacah: 0,
              submittedRespondent: 0,
              approved: 0,
              rejected: 0,
              rawRows: [],
            };
          }
          pplMap[row.emailPpl].totalAssignment += row.totalSekarang;
          pplMap[row.emailPpl].open += row.open;
          pplMap[row.emailPpl].draft += row.draft;
          pplMap[row.emailPpl].submittedPencacah += row.submittedPencacah;
          pplMap[row.emailPpl].submittedRespondent += row.submittedRespondent;
          pplMap[row.emailPpl].approved += row.approved;
          pplMap[row.emailPpl].rejected += row.rejected;
          pplMap[row.emailPpl].rawRows.push(row);
        });

        currentPMLPPLList = Object.values(pplMap);

        // Hitung aggregasi total pengawasan PML
        let teamAssignment = 0;
        let teamProgress = 0;
        let teamSubmittedUnchecked = 0;

        currentPMLPPLList.forEach((ppl) => {
          teamAssignment += ppl.totalAssignment;
          teamProgress +=
            ppl.submittedPencacah +
            ppl.submittedRespondent +
            ppl.approved +
            ppl.rejected;
          teamSubmittedUnchecked += ppl.submittedPencacah + ppl.submittedRespondent;
        });

        const teamPercentage =
          teamAssignment > 0
            ? ((teamProgress / teamAssignment) * 100).toFixed(2)
            : "0.00";

        const pmlWarningEl = document.getElementById("pml-warning");
        if (teamSubmittedUnchecked > 50) {
           pmlWarningEl.classList.remove("hidden");
        } else {
           pmlWarningEl.classList.add("hidden");
        }

        document.getElementById("pml-stat-ppl").textContent =
          currentPMLPPLList.length;
        document.getElementById("pml-stat-assignment").textContent = formatNumber(teamAssignment);
        document.getElementById("pml-stat-progress").textContent = formatNumber(teamProgress);
        document.getElementById("pml-stat-percentage").textContent = formatPercent(teamPercentage) + "%";
        document.getElementById("pml-stat-unchecked").textContent = formatNumber(teamSubmittedUnchecked);

        // Hitung peringkat PML & peringkat Tim
        const pmlScores = {};
        database.forEach((row) => {
          const key = row.pmlName;
          if (!key) return;
          if (!pmlScores[key]) {
            pmlScores[key] = { name: row.pmlName, approvedRejected: 0, totalAssignment: 0, progress: 0 };
          }
          pmlScores[key].approvedRejected += row.approved + row.rejected;
          pmlScores[key].totalAssignment += row.totalSekarang;
          pmlScores[key].progress += row.submittedPencacah + row.submittedRespondent + row.approved + row.rejected;
        });
        
        // Peringkat PML (Approve + Reject)
        const pmlListSorted = Object.values(pmlScores).sort((a, b) => b.approvedRejected - a.approvedRejected);
        let myRank = pmlListSorted.findIndex(p => p.name === currentUser.name) + 1;
        document.getElementById("pml-stat-rank").textContent = myRank > 0 ? `#${myRank}` : "-#";

        // Peringkat Tim (Skor)
        const timListSorted = Object.values(pmlScores).map(pml => {
          const pplPercent = pml.totalAssignment > 0 ? (pml.progress / pml.totalAssignment) * 100 : 0;
          const pmlPercent = pml.totalAssignment > 0 ? (pml.approvedRejected / pml.totalAssignment) * 100 : 0;
          const score = (pplPercent + pmlPercent) / 2;
          return { ...pml, score };
        }).sort((a, b) => b.score - a.score);
        
        let myTeamRank = timListSorted.findIndex(p => p.name === currentUser.name) + 1;
        document.getElementById("pml-stat-team-rank").textContent = myTeamRank > 0 ? `#${myTeamRank}` : "-#";

        // Hitung Peringkat Global PPL
        const globalPplScores = {};
        database.forEach((row) => {
          const key = row.emailPpl;
          if (!key) return;
          if (!globalPplScores[key]) {
            globalPplScores[key] = { progress: 0 };
          }
          globalPplScores[key].progress += row.submittedPencacah + row.submittedRespondent + row.approved + row.rejected;
        });

        const globalPplSorted = Object.entries(globalPplScores).sort((a, b) => b[1].progress - a[1].progress);
        const globalPplRanks = {};
        globalPplSorted.forEach((item, index) => {
           globalPplRanks[item[0]] = index + 1; // map email to rank
        });

        // Render PPL Cards
        const cardContainer = document.getElementById("pml-ppl-cards");
        cardContainer.innerHTML = "";

        if (currentPMLPPLList.length === 0) {
          cardContainer.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">Tidak ada PPL di bawah pengawasan Anda.</div>`;
          return;
        }

        currentPMLPPLList.sort((a, b) => {
          const progA =
            a.submittedPencacah +
            a.submittedRespondent +
            a.approved +
            a.rejected;
          const progB =
            b.submittedPencacah +
            b.submittedRespondent +
            b.approved +
            b.rejected;
          return progB - progA;
        });

        currentPMLPPLList.forEach((ppl) => {
          const progressVal =
            ppl.submittedPencacah +
            ppl.submittedRespondent +
            ppl.approved +
            ppl.rejected;
          const pplPercent =
            ppl.totalAssignment > 0
              ? ((progressVal / ppl.totalAssignment) * 100).toFixed(2)
              : "0.00";

          // Evaluasi Target Kemarin
          const startDate = new Date("2026-06-15T00:00:00");
          let today = new Date();
          today.setHours(0, 0, 0, 0);
          if (today < startDate || today > new Date("2026-07-31T00:00:00")) {
            today = new Date("2026-06-23T00:00:00");
          }
          const diffTime = today - startDate;
          const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const targetCumulativeYesterday =
            (daysElapsed > 1 ? daysElapsed - 1 : 1) * CONFIG.TARGET_PER_HARI_PPL;

          let badgeHtml = "";
          let warningHtml = "";

          if (daysElapsed > 1) {
            if (progressVal >= targetCumulativeYesterday) {
              badgeHtml = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Sesuai Target</span>`;
            } else {
              badgeHtml = `<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Kurang Target</span>`;
            }
          } else {
            badgeHtml = `<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Hari Ke-1</span>`;
          }

          if (ppl.draft > 20) {
             warningHtml += `<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-300 mr-1 mt-1 inline-block">Draft > 20</span>`;
          }
          if ((targetCumulativeYesterday - progressVal) >= 28) {
             warningHtml += `<span class="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-300 mt-1 inline-block">Hutang >= 28</span>`;
          }

          const myPplRank = globalPplRanks[ppl.email] || "-";
          const rankHtml = `<span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full block text-right mt-1 w-max ml-auto shadow-sm">Peringkat #${myPplRank}</span>`;

          const card = document.createElement("div");
          card.className =
            "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 transition-colors";
          card.innerHTML = `
          <div class="flex justify-between items-start gap-2 mb-3">
            <div class="min-w-0">
              <h4 class="font-bold text-slate-800 text-sm leading-tight">${ppl.name}</h4>
              <p class="text-xs text-slate-400 font-mono truncate">${ppl.email}</p>
              ${warningHtml}
            </div>
            <div class="shrink-0 flex flex-col items-end">${badgeHtml}${rankHtml}</div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div class="bg-orange-50 p-2 rounded-lg">
              <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Progres</span>
              <span class="font-bold text-slate-800 text-sm xl:text-base whitespace-nowrap">${formatNumber(progressVal)}/${formatNumber(targetCumulativeYesterday)}</span>
            </div>
            <div class="bg-blue-50 p-2 rounded-lg">
              <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Beban</span>
              <span class="font-bold text-blue-900 text-sm xl:text-base">${formatNumber(ppl.totalAssignment)}</span>
            </div>
            <div class="bg-emerald-50 p-2 rounded-lg">
              <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Selesai</span>
              <span class="font-bold text-emerald-600 text-base">${formatPercent(pplPercent)}%</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-4">
            <div class="bg-orange-500 h-1.5 rounded-full" style="width: ${pplPercent}%"></div>
          </div>
          <button onclick="showPPLDetailModal('${ppl.email}')" class="w-full bg-blue-900 hover:bg-indigo-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md">
            Lihat Rincian Wilayah
          </button>
        `;
          cardContainer.appendChild(card);
        });
      }

      // Modal popup detail SLS petugas
      function showPPLDetailModal(pplEmail) {
        // Cari data PPL tersebut
        let pplObj = null;
        if (currentUser.role === "PML") {
          pplObj = currentPMLPPLList.find((p) => p.email === pplEmail);
        } else if (currentUser.role === "Admin") {
          // Jika Admin, kumpulkan dari database langsung
          const listRows = database.filter((r) => r.emailPpl === pplEmail);
          if (listRows.length > 0) {
            pplObj = {
              name: listRows[0].pplName,
              email: pplEmail,
              rawRows: listRows,
            };
          }
        }

        if (!pplObj) return;

        document.getElementById("modal-title").textContent =
          "Rincian Wilayah Kerja Sensus";
        document.getElementById("modal-subtitle").innerHTML =
          `Pencacah Lapangan: <strong>${pplObj.name}</strong> (${pplObj.email})`;

        const cardContainer = document.getElementById("modal-cards-container");
        cardContainer.innerHTML = "";

        pplObj.rawRows.forEach((row) => {
          const submitted = row.submittedPencacah + row.submittedRespondent;
          const card = document.createElement("div");
          card.className =
            "bg-white p-4 rounded-2xl shadow-sm border border-slate-100";
          card.innerHTML = `
          <h4 class="font-bold text-slate-800 text-sm mb-3 truncate">${row.wilayah}</h4>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="bg-slate-50 p-2 rounded-lg">
              <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Total</span>
              <span class="font-bold text-slate-700">${formatNumber(row.totalSekarang)}</span>
            </div>
            <div class="bg-blue-50/50 p-2 rounded-lg">
              <span class="text-blue-500 block mb-0.5 text-[10px] font-semibold uppercase">Open</span>
              <span class="font-bold text-blue-700">${formatNumber(row.open)}</span>
            </div>
            <div class="bg-amber-50/50 p-2 rounded-lg">
              <span class="text-amber-500 block mb-0.5 text-[10px] font-semibold uppercase">Draft</span>
              <span class="font-bold text-amber-700">${formatNumber(row.draft)}</span>
            </div>
            <div class="bg-indigo-50/50 p-2 rounded-lg">
              <span class="text-indigo-500 block mb-0.5 text-[10px] font-semibold uppercase">Submitted</span>
              <span class="font-bold text-indigo-700">${formatNumber(submitted)}</span>
            </div>
            <div class="bg-emerald-50/50 p-2 rounded-lg">
              <span class="text-emerald-500 block mb-0.5 text-[10px] font-semibold uppercase">Approved</span>
              <span class="font-bold text-emerald-700">${formatNumber(row.approved)}</span>
            </div>
            <div class="bg-rose-50/50 p-2 rounded-lg">
              <span class="text-rose-500 block mb-0.5 text-[10px] font-semibold uppercase">Rejected</span>
              <span class="font-bold text-rose-700">${formatNumber(row.rejected)}</span>
            </div>
          </div>
        `;
          cardContainer.appendChild(card);
        });

        const modal = document.getElementById("modal-detail");
        modal.classList.remove("hidden");
      }

      function closeModal() {
        document.getElementById("modal-detail").classList.add("hidden");
      }

      // ================= IMPLEMENTASI ADMIN DASHBOARD =================
      let adminFilteredWilayahData = [];

      function renderAdminDashboard() {
        document.getElementById("panel-admin").classList.remove("hidden");

        // Populate Cascade Dropdowns
        populateAdminFilters();

        // Hitung dan update layout statistic admin
        calculateAdminStats();

        // Render Papan Peringkat / Leaderboards
        renderAdminLeaderboards();
      }

      function populateAdminFilters() {
        const pmlSelect = document.getElementById("admin-filter-pml");
        const pplSelect = document.getElementById("admin-filter-ppl");

        // Simpan nilai pilihan sebelumnya jika ada
        const prevPML = pmlSelect.value;
        const prevPPL = pplSelect.value;

        // Extract unique PMLs
        const pmls = [
          ...new Set(database.map((r) => r.pmlName).filter(Boolean)),
        ];
        pmlSelect.innerHTML = `<option value="ALL">Semua Tim PML</option>`;
        pmls.sort().forEach((p) => {
          pmlSelect.innerHTML += `<option value="${p}">${p}</option>`;
        });

        // Restore atau kembalikan pilihan PML
        if (pmls.includes(prevPML)) {
          pmlSelect.value = prevPML;
        }

        // Update PPL dropdown based on PML selection
        updatePPLDropdown(pmlSelect.value, prevPPL);
      }

      function updatePPLDropdown(selectedPML, prevPPLValue) {
        const pplSelect = document.getElementById("admin-filter-ppl");

        let filteredRows = database;
        if (selectedPML !== "ALL") {
          filteredRows = database.filter((r) => r.pmlName === selectedPML);
        }

        const ppls = [
          ...new Set(filteredRows.map((r) => r.pplName).filter(Boolean)),
        ];
        pplSelect.innerHTML = `<option value="ALL">Semua Petugas PPL</option>`;
        ppls.sort().forEach((p) => {
          pplSelect.innerHTML += `<option value="${p}">${p}</option>`;
        });

        if (ppls.includes(prevPPLValue)) {
          pplSelect.value = prevPPLValue;
        }
      }

      function onAdminPMLChange() {
        const selectedPML = document.getElementById("admin-filter-pml").value;
        updatePPLDropdown(selectedPML, "ALL");
        adminCurrentPage = 1; // Reset page
        calculateAdminStats();
        renderAdminLeaderboards();
      }

      function onAdminPPLChange() {
        adminCurrentPage = 1; // Reset page
        calculateAdminStats();
        renderAdminLeaderboards();
      }

      function calculateAdminStats() {
        const selectedPML = document.getElementById("admin-filter-pml").value;
        const selectedPPL = document.getElementById("admin-filter-ppl").value;

        let filtered = database;

        if (selectedPML !== "ALL") {
          filtered = filtered.filter((r) => r.pmlName === selectedPML);
        }
        if (selectedPPL !== "ALL") {
          filtered = filtered.filter((r) => r.pplName === selectedPPL);
        }

        adminFilteredWilayahData = filtered;

        // Aggregations
        let totalAssignment = 0;
        let totalOpen = 0;
        let totalDraft = 0;
        let totalSubmitted = 0;
        let totalApproved = 0;
        let totalRejected = 0;

        filtered.forEach((row) => {
          totalAssignment += row.totalSekarang;
          totalOpen += row.open;
          totalDraft += row.draft;
          totalSubmitted += row.submittedPencacah + row.submittedRespondent;
          totalApproved += row.approved;
          totalRejected += row.rejected;
        });

        document.getElementById("admin-stat-assignment").textContent =
          formatNumber(totalAssignment);
        document.getElementById("admin-stat-open").textContent = formatNumber(totalOpen);
        document.getElementById("admin-stat-draft").textContent = formatNumber(totalDraft);
        document.getElementById("admin-stat-submitted").textContent =
          formatNumber(totalSubmitted);
        document.getElementById("admin-stat-approved").textContent =
          formatNumber(totalApproved);
        document.getElementById("admin-stat-rejected").textContent =
          formatNumber(totalRejected);

        // Hitung persentase progress: (Submitted + Approved + Rejected) / Total Assignment
        const totalProgress = totalSubmitted + totalApproved + totalRejected;
        const percent =
          totalAssignment > 0
            ? ((totalProgress / totalAssignment) * 100).toFixed(2)
            : "0.00";
        document.getElementById("admin-stat-percentage").textContent =
          `${formatPercent(parseFloat(percent))}%`;
        document.getElementById("admin-stat-percentage-bar").style.width =
          `${percent}%`;

        const uniquePPLCount = [
          ...new Set(filtered.map((r) => r.emailPpl).filter(Boolean)),
        ].length;
        const activePPLCount =
          uniquePPLCount > 0
            ? uniquePPLCount
            : database.length > 0
              ? [...new Set(database.map((r) => r.emailPpl).filter(Boolean))]
                  .length
              : 142;

        const startDate = new Date("2026-06-15T00:00:00");
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today < startDate || today > new Date("2026-07-31T00:00:00")) {
          today = new Date("2026-06-23T00:00:00");
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const diffTime = today - startDate;
        const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const targetDaily =
          activePPLCount * CONFIG.TARGET_PER_HARI_PPL * (daysElapsed > 1 ? daysElapsed - 1 : 1);

        // Jabatan - Nama
        let subtitleText = "Seluruh Tim PPL";
        if (selectedPML !== "ALL" && selectedPPL === "ALL") {
          subtitleText = `Tim PML - ${selectedPML}`;
        } else if (selectedPPL !== "ALL") {
          subtitleText = `PPL - ${selectedPPL}`;
        } else if (selectedPML === "ALL" && selectedPPL === "ALL") {
          subtitleText = `Seluruh PPL (${activePPLCount})`;
        }
        document.getElementById("admin-stat-subtitle").textContent =
          subtitleText;

        document.getElementById("admin-stat-tersubmit").textContent =
          formatNumber(totalProgress);
        document.getElementById("admin-stat-tersubmit-total").textContent =
          formatNumber(totalAssignment);

        // Progres Pemeriksaan
        const totalDiperiksa = totalApproved + totalRejected;
        const pemeriksaanPercentStr = totalAssignment > 0 ? ((totalDiperiksa / totalAssignment) * 100).toFixed(2) : "0.00";
        
        document.getElementById("admin-stat-pemeriksaan-subtitle").textContent = subtitleText;
        document.getElementById("admin-stat-pemeriksaan-percentage").textContent = formatPercent(parseFloat(pemeriksaanPercentStr)) + "%";
        document.getElementById("admin-stat-diperiksa").textContent = formatNumber(totalDiperiksa);
        document.getElementById("admin-stat-diperiksa-total").textContent = formatNumber(totalAssignment);
        document.getElementById("admin-stat-pemeriksaan-percentage-bar").style.width = pemeriksaanPercentStr + "%";

        document.getElementById("admin-stat-target-date").textContent =
          `Target per: ${yesterdayStr}`;
        document.getElementById("admin-stat-kumulatif").textContent =
          `${formatNumber(totalProgress)} / ${formatNumber(targetDaily)}`;
        document.getElementById("admin-stat-total-beban-info").textContent =
          formatNumber(totalAssignment);

        const badgeEl = document.getElementById("admin-target-badge");
        if (totalProgress >= targetDaily) {
          badgeEl.innerHTML = `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Mencapai target harian ✅</span>`;
        } else {
          badgeEl.innerHTML = `<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">Tidak mencapai target harian ⚠️</span>`;
        }

        // Render Cards Rincian Wilayah Admin
        displayAdminWilayahCards(adminFilteredWilayahData);

        // Update Map if active
        if (map) {
           updateMap();
        }
      }

      // Render Admin wilayah sensus dalam format CARD GRID dengan PAGINATION
      function displayAdminWilayahCards(dataList) {
        const container = document.getElementById("admin-cards-container");
        container.innerHTML = "";

        if (dataList.length === 0) {
          container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">Tidak ada data wilayah yang sesuai filter.</div>`;
          document.getElementById("admin-page-info").textContent =
            "Halaman 0 dari 0";
          document.getElementById("admin-prev-btn").disabled = true;
          document.getElementById("admin-next-btn").disabled = true;
          return;
        }

        const totalPages = Math.ceil(dataList.length / pageSize);
        if (adminCurrentPage > totalPages) adminCurrentPage = totalPages || 1;

        const start = (adminCurrentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedList = dataList.slice(start, end);

        paginatedList.forEach((row) => {
          const sub = row.submittedPencacah + row.submittedRespondent;
          const totalProgress =
            row.submittedPencacah +
            row.submittedRespondent +
            row.approved +
            row.rejected;
          const percentage =
            row.totalSekarang > 0
              ? ((totalProgress / row.totalSekarang) * 100).toFixed(2)
              : "0.00";

          const card = document.createElement("div");
          card.className =
            "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all";
          card.innerHTML = `
          <div>
            <div class="flex justify-between items-start gap-2 mb-2">
              <h4 class="font-bold text-slate-800 text-sm">${row.wilayah}</h4>
              <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">${formatPercent(parseFloat(percentage))}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1 overflow-hidden mb-4">
              <div class="bg-emerald-500 h-1 rounded-full" style="width: ${percentage}%"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="bg-slate-50 p-2 rounded-lg">
                <span class="text-slate-400 block mb-0.5 text-[10px] font-semibold uppercase">Total Beban</span>
                <span class="font-bold text-slate-700 text-sm">${formatNumber(row.totalSekarang)}</span>
              </div>
              <div class="bg-blue-50 p-2 rounded-lg">
                <span class="text-blue-500 block mb-0.5 text-[10px] font-semibold uppercase">Progres</span>
                <span class="font-bold text-blue-700 text-sm">${formatNumber(totalProgress)}</span>
              </div>
              <div class="bg-indigo-50 p-2 rounded-lg col-span-2 flex justify-around">
                <div>
                  <span class="text-indigo-500 block text-[9px] font-semibold uppercase mb-0.5">Sub</span>
                  <span class="font-bold text-indigo-700 text-xs">${formatNumber(sub)}</span>
                </div>
                <div>
                  <span class="text-emerald-500 block text-[9px] font-semibold uppercase mb-0.5">App</span>
                  <span class="font-bold text-emerald-700 text-xs">${formatNumber(row.approved)}</span>
                </div>
                <div>
                  <span class="text-rose-500 block text-[9px] font-semibold uppercase mb-0.5">Rej</span>
                  <span class="font-bold text-rose-700 text-xs">${formatNumber(row.rejected)}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-3 flex flex-col gap-0.5 mt-3">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-semibold uppercase">PPL:</span>
              <button onclick="showPPLDetailModal('${row.emailPpl}')" class="text-blue-600 hover:text-indigo-900 font-bold hover:underline truncate max-w-[150px] text-right">
                ${row.pplName || "-"}
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-semibold uppercase">PML:</span>
              <span class="text-slate-500 font-medium truncate max-w-[150px] text-right">${row.pmlName || "-"}</span>
            </div>
          </div>
        `;
          container.appendChild(card);
        });

        document.getElementById("admin-page-info").textContent =
          `Halaman ${adminCurrentPage} dari ${totalPages}`;
        document.getElementById("admin-prev-btn").disabled =
          adminCurrentPage === 1;
        document.getElementById("admin-next-btn").disabled =
          adminCurrentPage === totalPages;
      }

      function changeAdminPage(direction) {
        adminCurrentPage += direction;
        filterAdminWilayah();
      }

      function filterAdminWilayah() {
        const keyword = document
          .getElementById("admin-search-wilayah")
          .value.toLowerCase()
          .trim();
        const filtered = adminFilteredWilayahData.filter((r) =>
          r.wilayah.toLowerCase().includes(keyword),
        );
        displayAdminWilayahCards(filtered);
      }

      // Leaderboard/Ranking Formula logic: sum(PQRS)
      function renderAdminLeaderboards() {
        const startDate = new Date("2026-06-15T00:00:00");
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today < startDate || today > new Date("2026-07-31T00:00:00")) {
          today = new Date("2026-06-23T00:00:00");
        }
        const diffTime = today - startDate;
        const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const targetPerPPL = 7 * (daysElapsed > 1 ? daysElapsed - 1 : 1);

        const selectedPML = document.getElementById("admin-filter-pml").value;
        const selectedPPL = document.getElementById("admin-filter-ppl").value;

        // 1. PPL Leaderboard
        const pplScores = {};
        database.forEach((row) => {
          const key = row.emailPpl;
          if (!key) return;
          if (!pplScores[key]) {
            pplScores[key] = {
              name: row.pplName,
              email: row.emailPpl,
              pmlName: row.pmlName,
              totalAssignment: 0,
              progress: 0,
            };
          }
          pplScores[key].totalAssignment += row.totalSekarang;
          pplScores[key].progress +=
            row.submittedPencacah +
            row.submittedRespondent +
            row.approved +
            row.rejected;
        });

        const pplListSorted = Object.values(pplScores)
          .sort((a, b) => b.progress - a.progress)
          .map((item, index) => ({ ...item, globalRank: index }));

        const pplListFiltered = pplListSorted.filter(ppl => {
          if (selectedPML !== "ALL" && ppl.pmlName !== selectedPML) return false;
          if (selectedPPL !== "ALL" && ppl.name !== selectedPPL) return false;
          return true;
        });

        const pplLeaderDiv = document.getElementById("admin-leaderboard-ppl");
        pplLeaderDiv.innerHTML = "";

        pplListFiltered.forEach((ppl) => {
          let medal = "";
          if (ppl.globalRank === 0) medal = "🥇 ";
          else if (ppl.globalRank === 1) medal = "🥈 ";
          else if (ppl.globalRank === 2) medal = "🥉 ";
          else
            medal = `<span class="inline-block w-5 text-slate-400 text-xs font-bold text-center">${ppl.globalRank + 1}</span> `;

          const percent =
            ppl.totalAssignment > 0
              ? ((ppl.progress / ppl.totalAssignment) * 100)
              : 0;

          const badge =
            ppl.progress >= targetPerPPL
              ? `<span class="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">✅ Target</span>`
              : `<span class="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">⚠️ Belum</span>`;

          const item = document.createElement("div");
          item.className =
            "flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-500/20 transition-all cursor-pointer";
          item.onclick = function () {
            showPPLDetailModal(ppl.email);
          };
          item.innerHTML = `
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <div>${medal}</div>
            <div class="truncate">
              <span class="font-bold text-slate-700 text-xs sm:text-sm block truncate">${ppl.name}</span>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="text-[9px] text-slate-400 truncate">PML: ${ppl.pmlName}</span>
                ${badge}
              </div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-bold text-orange-500 block">${formatNumber(ppl.progress)} / ${formatNumber(ppl.totalAssignment)}</span>
            <span class="text-[10px] font-semibold text-slate-400 block">${formatPercent(percent)}%</span>
          </div>
        `;
          pplLeaderDiv.appendChild(item);
        });

        // 2. PML Leaderboard (Team aggregations)
        const pmlScores = {};
        database.forEach((row) => {
          const key = row.pmlName;
          if (!key) return;
          if (!pmlScores[key]) {
            pmlScores[key] = {
              name: row.pmlName,
              totalAssignment: 0,
              progress: 0,
              approvedRejected: 0,
              pplEmails: new Set(),
              pplNames: new Set(),
            };
          }
          if (row.emailPpl) {
             pmlScores[key].pplEmails.add(row.emailPpl);
             pmlScores[key].pplNames.add(row.pplName);
          }
          pmlScores[key].totalAssignment += row.totalSekarang;
          pmlScores[key].progress +=
            row.submittedPencacah +
            row.submittedRespondent +
            row.approved +
            row.rejected;
          pmlScores[key].approvedRejected += row.approved + row.rejected;
        });

        const pmlListSorted = Object.values(pmlScores)
          .sort((a, b) => b.approvedRejected - a.approvedRejected)
          .map((item, index) => ({ ...item, globalRank: index }));

        const pmlListFiltered = pmlListSorted.filter(pml => {
          if (selectedPML !== "ALL" && pml.name !== selectedPML) return false;
          if (selectedPPL !== "ALL" && !pml.pplNames.has(selectedPPL)) return false;
          return true;
        });

        const pmlLeaderDiv = document.getElementById("admin-leaderboard-pml");
        pmlLeaderDiv.innerHTML = "";

        pmlListFiltered.forEach((pml) => {
          let medal = "";
          if (pml.globalRank === 0) medal = "🥇 ";
          else if (pml.globalRank === 1) medal = "🥈 ";
          else if (pml.globalRank === 2) medal = "🥉 ";
          else
            medal = `<span class="inline-block w-5 text-slate-400 text-xs font-bold text-center">${pml.globalRank + 1}</span> `;

          const percent =
            pml.totalAssignment > 0
              ? ((pml.progress / pml.totalAssignment) * 100)
              : 0;

          const targetTeam = targetPerPPL * pml.pplEmails.size;
          const badge =
            pml.progress >= targetTeam
              ? `<span class="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">✅ Target</span>`
              : `<span class="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">⚠️ Belum</span>`;

          const item = document.createElement("div");
          item.className =
            "flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-900/10 transition-all";
          item.innerHTML = `
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <div>${medal}</div>
            <div class="truncate">
              <span class="font-bold text-slate-700 text-xs sm:text-sm block truncate">${pml.name}</span>
              ${badge}
            </div>
          </div>
          <div class="text-right shrink-0">
             <span class="text-xs font-bold text-emerald-600 block">${formatNumber(pml.approvedRejected)} <span class="font-normal text-[10px] text-slate-500">Approve+Reject</span></span>
             <span class="text-[10px] font-semibold text-slate-400 block">${formatNumber(pml.progress)} / ${formatNumber(pml.totalAssignment)} (${formatPercent(percent)}%)</span>
          </div>
        `;
          pmlLeaderDiv.appendChild(item);
        });

        // 3. Tim Leaderboard (Average of PPL % and PML %)
        const timListSorted = Object.values(pmlScores).map(pml => {
          const pplPercent = pml.totalAssignment > 0 ? (pml.progress / pml.totalAssignment) * 100 : 0;
          const pmlPercent = pml.totalAssignment > 0 ? (pml.approvedRejected / pml.totalAssignment) * 100 : 0;
          const score = (pplPercent + pmlPercent) / 2;
          return { ...pml, score, pplPercent, pmlPercent };
        })
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, globalRank: index }));

        const timListFiltered = timListSorted.filter(tim => {
          if (selectedPML !== "ALL" && tim.name !== selectedPML) return false;
          if (selectedPPL !== "ALL" && !tim.pplNames.has(selectedPPL)) return false;
          return true;
        });

        const timLeaderDiv = document.getElementById("admin-leaderboard-tim");
        timLeaderDiv.innerHTML = "";

        timListFiltered.forEach((tim) => {
          let medal = "";
          if (tim.globalRank === 0) medal = "🥇 ";
          else if (tim.globalRank === 1) medal = "🥈 ";
          else if (tim.globalRank === 2) medal = "🥉 ";
          else
            medal = `<span class="inline-block w-5 text-slate-400 text-xs font-bold text-center">${tim.globalRank + 1}</span> `;

          const item = document.createElement("div");
          item.className =
            "flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 transition-all";
          item.innerHTML = `
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <div>${medal}</div>
            <div class="truncate">
              <span class="font-bold text-slate-700 text-xs sm:text-sm block truncate">${tim.name}</span>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[9px] text-slate-400">PPL: <span class="font-bold text-blue-600">${formatPercent(tim.pplPercent)}%</span></span>
                <span class="text-[9px] text-slate-400">PML: <span class="font-bold text-emerald-600">${formatPercent(tim.pmlPercent)}%</span></span>
              </div>
            </div>
          </div>
          <div class="text-right shrink-0">
             <span class="text-sm font-bold text-emerald-600 block">${formatPercent(tim.score)}%</span>
             <span class="text-[9px] font-semibold text-slate-400 block uppercase">Skor Tim</span>
          </div>
        `;
          timLeaderDiv.appendChild(item);
        });
      }

      function closeAdminAlertModal() {
        const modal = document.getElementById("modal-admin-alert");
        modal.querySelector("div").classList.remove("scale-100");
        modal.querySelector("div").classList.add("scale-95");
        setTimeout(() => {
          modal.classList.add("hidden");
        }, 150);
      }

      function showAdminListModal(type) {
        let list = [];
        let title = "";
        let filterLogic = null;
        let sortLogic = null;

        if (type === 'HUTANG_PML') {
          const pmlMap = {};
          adminFilteredWilayahData.forEach(row => {
            if (!row.pmlName) return;
            if (!pmlMap[row.pmlName]) {
              pmlMap[row.pmlName] = {
                name: row.pmlName,
                submittedUnchecked: 0,
                approved: 0,
                rejected: 0,
                submittedTotal: 0
              };
            }
            pmlMap[row.pmlName].submittedUnchecked += row.submittedPencacah + row.submittedRespondent;
            pmlMap[row.pmlName].approved += row.approved;
            pmlMap[row.pmlName].rejected += row.rejected;
            pmlMap[row.pmlName].submittedTotal += row.submittedPencacah + row.submittedRespondent + row.approved + row.rejected;
          });
          list = Object.values(pmlMap);
          title = "PML Progres Rendah (Belum Diperiksa > 50)";
          filterLogic = (p) => p.submittedUnchecked > 50;
          sortLogic = (a, b) => b.submittedUnchecked - a.submittedUnchecked;
        } else {
          // Find data from adminFilteredWilayahData and group by PPL
          const pplMap = {};
          adminFilteredWilayahData.forEach(row => {
            if (!row.emailPpl) return;
            if (!pplMap[row.emailPpl]) {
              pplMap[row.emailPpl] = {
                name: row.pplName,
                pmlName: row.pmlName,
                draft: 0,
                progress: 0,
                submittedUnchecked: 0,
                approved: 0,
                rejected: 0,
                submittedTotal: 0
              };
            }
            pplMap[row.emailPpl].draft += row.draft;
            pplMap[row.emailPpl].progress += row.submittedPencacah + row.submittedRespondent + row.approved + row.rejected;
            pplMap[row.emailPpl].submittedUnchecked += row.submittedPencacah + row.submittedRespondent;
            pplMap[row.emailPpl].approved += row.approved;
            pplMap[row.emailPpl].rejected += row.rejected;
            pplMap[row.emailPpl].submittedTotal += row.submittedPencacah + row.submittedRespondent + row.approved + row.rejected;
          });
          list = Object.values(pplMap);

          if (type === 'DRAFT') {
            title = "PPL dengan Draft > 20";
            filterLogic = (p) => p.draft > 20;
            sortLogic = (a, b) => b.draft - a.draft; // highest draft first
          } else if (type === 'HUTANG') {
            const startDate = new Date(2026, 5, 15); // 15 Juni 2026
            const today = new Date();
            const diffTime = today - startDate;
            const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const targetCumulativeYesterday = (daysElapsed - 1) * CONFIG.TARGET_PER_HARI_PPL;

            title = "PPL Progres Rendah (Hutang >= 28)";
            filterLogic = (p) => (targetCumulativeYesterday - p.progress) >= 28;
            sortLogic = (a, b) => a.progress - b.progress; // lowest progress first
          }
        }

        list = list.filter(filterLogic).sort(sortLogic);

        // Populate Modal
        document.getElementById("admin-alert-title").textContent = title;
        const container = document.getElementById("admin-alert-container");
        container.innerHTML = "";

        if (list.length === 0) {
          container.innerHTML = '<p class="text-slate-500 text-sm italic col-span-full">Tidak ada data petugas yang sesuai kriteria ini.</p>';
        } else {
          list.forEach((p, idx) => {
            const card = document.createElement("div");
            card.className = "p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center";
            let valHtml = "";
            let pmlSubtitle = p.pmlName ? `PML: ${p.pmlName}` : 'Tim Pengawas';

            if (type === 'DRAFT') {
               valHtml = `<span class="text-xl font-bold text-amber-600">${formatNumber(p.draft)}</span><span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Draft</span>`;
            } else if (type === 'HUTANG') {
               const startDate = new Date(2026, 5, 15);
               const today = new Date();
               const diffTime = today - startDate;
               const daysElapsed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
               const targetCumulativeYesterday = (daysElapsed - 1) * CONFIG.TARGET_PER_HARI_PPL;
               const hutang = targetCumulativeYesterday - p.progress;
               valHtml = `<span class="text-xl font-bold text-rose-600">-${formatNumber(hutang)}</span><span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Progres: ${formatNumber(p.progress)}</span>`;
            } else if (type === 'HUTANG_PML') {
               const ratio = p.submittedTotal > 0 ? (p.approved + p.rejected) / p.submittedTotal * 100 : 0;
               valHtml = `<span class="text-xl font-bold text-rose-600">${formatNumber(p.submittedUnchecked)}</span><span class="text-[9px] font-semibold uppercase tracking-wider text-slate-500 block mt-1">App+Rej: ${formatNumber(p.approved + p.rejected)} / ${formatNumber(p.submittedTotal)} (${formatPercent(ratio)}%)</span>`;
            }

            card.innerHTML = `
              <div class="overflow-hidden mr-2">
                <span class="font-bold text-slate-700 text-sm block truncate">${idx + 1}. ${p.name}</span>
                <span class="text-xs text-slate-500 block truncate mt-0.5">${pmlSubtitle}</span>
              </div>
              <div class="text-right shrink-0">
                ${valHtml}
              </div>
            `;
            container.appendChild(card);
          });
        }

        // Show Modal
        const modal = document.getElementById("modal-admin-alert");
        modal.classList.remove("hidden");
        setTimeout(() => {
          modal.querySelector("div").classList.remove("scale-95");
          modal.querySelector("div").classList.add("scale-100");
        }, 10);
      }

      // ================= PETA INTERAKTIF =================
      let map = null;
      let geojsonLayer = null;

      function toggleAdminMap() {
        const container = document.getElementById("admin-map-container");
        const btnText = document.getElementById("map-toggle-text");
        
        if (container.classList.contains("hidden")) {
           container.classList.remove("hidden");
           btnText.textContent = "Sembunyikan Peta";
           // Init map if not yet initialized
           if (!map) {
              setTimeout(() => {
                 initMap();
              }, 100);
           } else {
              map.invalidateSize();
              updateMap(); // re-render with current filters
           }
        } else {
           container.classList.add("hidden");
           btnText.textContent = "Lihat Peta Interaktif";
        }
      }

      function initMap() {
         if (typeof L === "undefined") {
            console.error("Leaflet not loaded");
            return;
         }
         
         // Initialize map centered on Kepahiang
         map = L.map('map').setView([-3.64, 102.58], 11);
         
         L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
             attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
             subdomains: 'abcd',
             maxZoom: 20
         }).addTo(map);

         updateMap();
      }

      function getProgressColor(percent) {
         if (percent >= 80) return "#10b981"; // emerald-500
         if (percent >= 50) return "#f97316"; // orange-500
         return "#f43f5e"; // rose-500
      }

      function updateMap() {
         if (!map || typeof GEOJSON_DATA === "undefined") return;
         
         if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
         }

         // Create a lookup for idsubsls from adminFilteredWilayahData
         const progressMap = {};
         adminFilteredWilayahData.forEach(row => {
            if (row.idSubSls) {
               progressMap[row.idSubSls] = row;
            }
         });

         geojsonLayer = L.geoJSON(GEOJSON_DATA, {
             style: function(feature) {
                 const id = feature.properties.idsubsls;
                 const row = progressMap[id];
                 let fillColor = "#cbd5e1"; // slate-300 if no data
                 let fillOpacity = 0.4;
                 let weight = 1;

                 if (row) {
                    const totalTarget = row.totalSekarang;
                    const progress = row.approved + row.rejected;
                    const pct = totalTarget > 0 ? (progress / totalTarget * 100) : 0;
                    
                    if (totalTarget > 0) {
                       fillColor = getProgressColor(pct);
                       fillOpacity = 0.7;
                    }
                 }

                 return {
                     fillColor: fillColor,
                     weight: weight,
                     opacity: 1,
                     color: 'white',
                     dashArray: '3',
                     fillOpacity: fillOpacity
                 };
             },
             onEachFeature: function(feature, layer) {
                 const id = feature.properties.idsubsls;
                 const row = progressMap[id];
                 
                 let popupContent = `<div class="p-1">
                    <p class="font-bold text-sm mb-1">${feature.properties.nmsls}</p>
                    <p class="text-xs text-slate-500 mb-2">${feature.properties.nmdesa}, ${feature.properties.nmkec}</p>
                 `;

                 if (row) {
                    const progress = row.approved + row.rejected;
                    const pct = row.totalSekarang > 0 ? (progress / row.totalSekarang * 100).toFixed(1) : "0.0";
                    popupContent += `
                       <div class="grid grid-cols-2 gap-2 text-xs">
                         <span class="font-semibold text-slate-600">PPL:</span> <span class="font-bold text-slate-800">${row.pplName}</span>
                         <span class="font-semibold text-slate-600">PML:</span> <span class="font-bold text-slate-800">${row.pmlName}</span>
                         <span class="font-semibold text-slate-600 mt-1">Approve+Reject:</span> <span class="font-bold text-emerald-600 mt-1">${formatNumber(progress)} / ${formatNumber(row.totalSekarang)} (${pct}%)</span>
                       </div>
                    `;
                 } else {
                    popupContent += `<p class="text-xs text-rose-500 italic">Data progres tidak ditemukan atau sedang difilter.</p>`;
                 }
                 popupContent += `</div>`;
                 
                 layer.bindTooltip(popupContent, {
                    sticky: true,
                    className: 'shadow-lg border-0 rounded-lg p-2'
                 });

                 // Hover effect
                 layer.on({
                    mouseover: function(e) {
                       const l = e.target;
                       l.setStyle({
                          weight: 3,
                          color: '#64748b',
                          dashArray: '',
                          fillOpacity: 0.9
                       });
                       l.bringToFront();
                    },
                    mouseout: function(e) {
                       geojsonLayer.resetStyle(e.target);
                    }
                 });
             }
         }).addTo(map);

         // Fit bounds if there are any mapped features
         if (Object.keys(progressMap).length > 0 && geojsonLayer.getBounds().isValid()) {
            map.fitBounds(geojsonLayer.getBounds());
         }
      }
    
