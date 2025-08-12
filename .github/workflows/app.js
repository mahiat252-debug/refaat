(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF'
diff --git a/app.js b/app.js
--- a/app.js
+++ b/app.js
@@ -0,0 +1,229 @@
+// تأكد من أن هذا الرابط هو الرابط العام الذي يسمح بالوصول للجميع
+const SHEET_URL = "https://opensheet.elk.sh/1IC_POuvxv9X2vE862HkoGlrvIIxnWgmJ4-jEMXRi0bk/Sheet1";
+
+// !! مهم: استبدل هذا الرابط بالرابط الجديد الذي حصلت عليه بعد إعادة النشر
+const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyfjH09tRmGTdJ-QSK5PrcWD40W9tTZ5gmKd_XpZc5DHvstBe3sF5uwP2zz53aEWsNt/exec";
+
+let usersData = [];
+let currentUser = null;
+
+async function loadData() {
+  try {
+    const response = await fetch(SHEET_URL);
+    usersData = await response.json();
+  } catch (error) {
+    showError("حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة لاحقًا.");
+  }
+}
+loadData();
+
+function openEmailModal(nationalId, hasEmail) {
+  document.getElementById('user-national-id').textContent = nationalId;
+  if (hasEmail) {
+    document.getElementById('modal-message').textContent = "تم العثور على بريد إلكتروني مسجل مسبقًا. يمكنك تحديثه الآن.";
+  } else {
+    document.getElementById('modal-message').textContent = "لم يتم العثور على بريد إلكتروني مرتبط بهذا الرقم القومي. الرجاء إدخال بريد إلكتروني صالح.";
+  }
+  document.getElementById('email-modal').style.display = 'block';
+  document.getElementById('email-modal-overlay').style.display = 'block';
+  document.getElementById('new-email-input').focus();
+}
+
+function closeEmailModal() {
+  document.getElementById('email-modal').style.display = 'none';
+  document.getElementById('email-modal-overlay').style.display = 'none';
+  document.getElementById('new-email-input').value = '';
+  document.getElementById('confirm-email-input').value = '';
+  document.getElementById('email-error').classList.add('hidden');
+}
+
+document.getElementById('new-search-btn').addEventListener('click', function () {
+  document.querySelector('.search-container').style.display = 'block';
+  document.getElementById('result-section').style.display = 'none';
+  document.getElementById('instructions-section').style.display = 'block';
+  document.getElementById('email-input').value = '';
+  document.getElementById('national-id-input').value = '';
+});
+
+document.getElementById('close-email-modal').addEventListener('click', closeEmailModal);
+document.getElementById('cancel-email-btn').addEventListener('click', closeEmailModal);
+document.getElementById('email-modal-overlay').addEventListener('click', closeEmailModal);
+
+document.getElementById('login-form').addEventListener('submit', function (event) {
+  event.preventDefault();
+  const email = document.getElementById('email-input').value.trim();
+  const nationalId = document.getElementById('national-id-input').value.trim();
+
+  document.getElementById('email-input').classList.remove('input-error');
+  document.getElementById('national-id-input').classList.remove('input-error');
+  document.getElementById('error-section').style.display = "none";
+  document.getElementById('result-section').style.display = "none";
+  document.getElementById('update-success').style.display = "none";
+
+  document.getElementById('instructions-section').style.display = 'block';
+
+  if (nationalId.length !== 14 || !/^\d{14}$/.test(nationalId)) {
+    showError("الرقم القومي يجب أن يتكون من 14 رقمًا فقط.");
+    document.getElementById('national-id-input').classList.add('input-error');
+    return;
+  }
+
+  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+  if (!emailRegex.test(email)) {
+    showError("صيغة البريد الإلكتروني غير صحيحة.");
+    document.getElementById('email-input').classList.add('input-error');
+    return;
+  }
+
+  const user = usersData.find((item) => item["الرقم القومى"] === nationalId);
+
+  if (!user) {
+    showError("لا يوجد مستخدم بهذا الرقم القومي في النظام.");
+    document.getElementById('national-id-input').classList.add('input-error');
+    return;
+  }
+
+  currentUser = user;
+
+  if (user["البريد"] && user["البريد"].trim() !== '') {
+    if (user["البريد"] === email) {
+      showResult(user);
+    } else {
+      showError("البريد الإلكتروني المدخل غير متطابق مع البريد المسجل لهذا الرقم القومي.");
+    }
+  } else {
+    openEmailModal(nationalId, false);
+  }
+});
+
+document.getElementById('email-form').addEventListener('submit', async function (event) {
+  event.preventDefault();
+  const email = document.getElementById('new-email-input').value.trim();
+  const confirmEmail = document.getElementById('confirm-email-input').value.trim();
+  const errorElement = document.getElementById('email-error');
+  const nationalId = document.getElementById('user-national-id').textContent;
+
+  errorElement.classList.add('hidden');
+
+  if (email !== confirmEmail) {
+    document.getElementById('email-error-message').textContent = "البريد الإلكتروني وتأكيده غير متطابقين.";
+    errorElement.classList.remove('hidden');
+    return;
+  }
+
+  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+  if (!emailRegex.test(email)) {
+    document.getElementById('email-error-message').textContent = "صيغة البريد الإلكتروني غير صحيحة.";
+    errorElement.classList.remove('hidden');
+    return;
+  }
+
+  const emailExists = usersData.some(
+    (user) =>
+      user["البريد"] &&
+      user["البريد"].toLowerCase() === email.toLowerCase() &&
+      user["الرقم القومى"] !== currentUser["الرقم القومى"]
+  );
+
+  if (emailExists) {
+    document.getElementById('email-error-message').textContent = "البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر.";
+    errorElement.classList.remove('hidden');
+    return;
+  }
+
+  const updateResult = await searchAndUpdateEmail(nationalId, email);
+
+  if (updateResult.success) {
+    closeEmailModal();
+    showResult(currentUser);
+    document.getElementById('update-success').style.display = 'flex';
+    setTimeout(() => {
+      document.getElementById('update-success').style.display = 'none';
+    }, 5000);
+  } else {
+    document.getElementById('email-error-message').textContent = updateResult.message;
+    errorElement.classList.remove('hidden');
+  }
+});
+
+async function searchAndUpdateEmail(nationalId, newEmail) {
+  const saveButton = document.getElementById('save-email-btn');
+  const originalButtonText = saveButton.innerHTML;
+
+  try {
+    saveButton.disabled = true;
+    saveButton.innerHTML = '<div class="loading-spinner"></div> جاري الحفظ...';
+
+    const response = await fetch(GAS_WEB_APP_URL, {
+      method: 'POST',
+      body: JSON.stringify({
+        nationalId: nationalId,
+        email: newEmail,
+      }),
+    });
+
+    const result = await response.json();
+
+    if (result.status === 'success') {
+      const userIndex = usersData.findIndex((u) => u["الرقم القومى"] === nationalId);
+      if (userIndex !== -1) {
+        usersData[userIndex]["البريد"] = newEmail;
+        currentUser["البريد"] = newEmail;
+      }
+      return { success: true, message: 'تم تحديث البريد الإلكتروني بنجاح' };
+    } else {
+      return { success: false, message: result.message || 'حدث خطأ أثناء التحديث' };
+    }
+  } catch (error) {
+    console.error('حدث خطأ في الاتصال:', error);
+    return { success: false, message: 'فشل الاتصال بالخادم' };
+  } finally {
+    saveButton.disabled = false;
+    saveButton.innerHTML = originalButtonText;
+  }
+}
+
+function showResult(user) {
+  document.querySelector('.search-container').style.display = 'none';
+  document.getElementById('instructions-section').style.display = 'none';
+  document.getElementById('error-section').style.display = 'none';
+  document.getElementById('result-section').style.display = 'block';
+
+  const fieldsToDisplay = [
+    'الاسم',
+    'الرقم القومى',
+    'الدرجة',
+    'عدد التذاكر',
+    'اساسى 2014',
+    'اساسى يوليو 2025',
+  ];
+
+  let userHtml = '';
+  fieldsToDisplay.forEach((key) => {
+    if (user[key]) {
+      userHtml += `<div class="info-item"><div class="info-label">${key}</div><div class="info-value">${user[key]}</div></div>`;
+    }
+  });
+
+  const additionalFields = Object.keys(user).filter(
+    (key) => !fieldsToDisplay.includes(key) && key !== 'البريد'
+  );
+
+  if (additionalFields.length > 0) {
+    userHtml += `<div class="py-3 px-4 bg-slate-50"><h3 class="font-bold text-blue-700">معلومات إضافية</h3></div>`;
+    additionalFields.forEach((key) => {
+      if (user[key]) {
+        userHtml += `<div class="info-item"><div class="info-label">${key}</div><div class="info-value">${user[key]}</div></div>`;
+      }
+    });
+  }
+
+  document.getElementById('user-data').innerHTML = userHtml;
+}
+
+function showError(message) {
+  document.getElementById('instructions-section').style.display = 'block';
+  document.getElementById('result-section').style.display = 'none';
+  document.getElementById('error-section').style.display = 'block';
+  document.getElementById('error-message').textContent = message;
+}
EOF
)
