// حالة التطبيق
const state = {
    schools: [],
    currentSchoolId: 1,
    scriptUrl: 'https://script.google.com/macros/s/AKfycbwYsQ5rc3dPSaoTzT6aToGMfbnQ-eXrmhkPzLPDc-QpBLuVUQ5IgdcgqQ75zdJRxmcfNQ/exec',
    useCorsProxy: false
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // تعيين التاريخ الحالي
    setCurrentDate();
    
    // تحميل البيانات المحفوظة
    loadSavedData();
    
    // تحميل الإعدادات
    loadSettings();
    
    // إعداد معالج الأحداث
    setupEventListeners();
    
    // تحديث واجهة المستخدم
    updateUI();
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function setupEventListeners() {
    // تغيير المرحلة التعليمية
    document.getElementById('educationLevel').addEventListener('change', function() {
        generateGradeInputs(this.value);
    });
    
    // حفظ البيانات
    document.getElementById('saveBtn').addEventListener('click', saveSchoolData);
    
    // ترحيل البيانات
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // مسح الكل
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    
    // اختبار الاتصال
    document.getElementById('testConnection').addEventListener('click', testConnection);
    
    // تحديث رابط السكريبت
    document.getElementById('scriptUrl').addEventListener('change', function() {
        state.scriptUrl = this.value;
        saveSettings();
    });
    
    // تحديث إعدادات CORS
    document.getElementById('useCorsProxy').addEventListener('change', function() {
        state.useCorsProxy = this.checked;
        saveSettings();
    });
}

function generateGradeInputs(educationLevel) {
    const container = document.getElementById('gradesContainer');
    container.innerHTML = '';
    
    const gradeCount = educationLevel === 'ابتدائي' ? 6 : 3;
    
    for (let i = 1; i <= gradeCount; i++) {
        const gradeSection = document.createElement('div');
        gradeSection.className = 'grade-section';
        gradeSection.innerHTML = `
            <h3 class="grade-title">
                <i class="fas fa-graduation-cap"></i> الصف ${this.getGradeName(i)}
            </h3>
            <div class="grade-inputs">
                <div class="form-group">
                    <label for="grade${i}Enrolled">عدد المقيدين</label>
                    <input type="number" id="grade${i}Enrolled" min="0" value="0" class="grade-input">
                </div>
                <div class="form-group">
                    <label for="grade${i}Present">عدد الحاضرين</label>
                    <input type="number" id="grade${i}Present" min="0" value="0" class="grade-input">
                </div>
                <div class="form-group">
                    <label for="grade${i}Absent">عدد الغائبين</label>
                    <input type="number" id="grade${i}Absent" min="0" value="0" class="grade-input">
                </div>
            </div>
        `;
        container.appendChild(gradeSection);
    }
}

function getGradeName(gradeNumber) {
    const names = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    return names[gradeNumber] || gradeNumber;
}

function saveSchoolData() {
    // التحقق من البيانات الأساسية
    const schoolCode = document.getElementById('schoolCode').value.trim();
    const schoolName = document.getElementById('schoolName').value.trim();
    const educationLevel = document.getElementById('educationLevel').value;
    const date = document.getElementById('date').value;
    
    if (!schoolCode || !schoolName || !educationLevel || !date) {
        showAlert('يرجى ملء جميع البيانات الأساسية', 'error');
        return;
    }
    
    // جمع بيانات الصفوف
    const grades = {};
    const gradeCount = educationLevel === 'ابتدائي' ? 6 : 3;
    
    for (let i = 1; i <= gradeCount; i++) {
        const enrolled = parseInt(document.getElementById(`grade${i}Enrolled`).value) || 0;
        const present = parseInt(document.getElementById(`grade${i}Present`).value) || 0;
        const absent = parseInt(document.getElementById(`grade${i}Absent`).value) || 0;
        
        // التحقق من تناسق البيانات
        if (present + absent > enrolled) {
            showAlert(`عدد الحاضرين والغائبين في الصف ${getGradeName(i)} أكبر من عدد المقيدين`, 'error');
            return;
        }
        
        grades[`grade${i}`] = { enrolled, present, absent };
    }
    
    // إنشاء كائن المدرسة
    const school = {
        id: state.currentSchoolId++,
        schoolCode,
        schoolName,
        educationLevel,
        date,
        timestamp: new Date().toLocaleString('ar-EG'),
        grades
    };
    
    // إضافة المدرسة
    state.schools.push(school);
    
    // حفظ البيانات
    saveData();
    
    // تحديث الواجهة
    updateUI();
    
    // إعادة تعيين النموذج
    resetForm();
    
    showAlert('تم حفظ بيانات المدرسة بنجاح', 'success');
}

function updateUI() {
    updateSavedDataList();
    updateSummary();
}

function updateSavedDataList() {
    const container = document.getElementById('savedData');
    container.innerHTML = '';
    
    if (state.schools.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray);">لا توجد بيانات محفوظة</p>';
        return;
    }
    
    state.schools.forEach(school => {
        const schoolElement = document.createElement('div');
        schoolElement.className = 'school-item';
        schoolElement.innerHTML = `
            <div class="school-header">
                <span class="school-name">${school.schoolName} (${school.schoolCode})</span>
                <button onclick="deleteSchool(${school.id})" class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
            <div class="school-meta">
                <span>المرحلة: ${school.educationLevel}</span>
                <span>التاريخ: ${school.date}</span>
                <span>الوقت: ${school.timestamp}</span>
            </div>
        `;
        container.appendChild(schoolElement);
    });
}

function updateSummary() {
    // يمكن إضافة ملخص إحصائي هنا إذا لزم الأمر
}

function resetForm() {
    document.getElementById('schoolCode').value = '';
    document.getElementById('schoolName').value = '';
    document.getElementById('educationLevel').value = '';
    setCurrentDate();
    document.getElementById('gradesContainer').innerHTML = '';
}

function deleteSchool(schoolId) {
    if (confirm('هل أنت متأكد من حذف هذه المدرسة؟')) {
        state.schools = state.schools.filter(school => school.id !== schoolId);
        saveData();
        updateUI();
        showAlert('تم حذف المدرسة بنجاح', 'success');
    }
}

function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        state.schools = [];
        state.currentSchoolId = 1;
        saveData();
        updateUI();
        resetForm();
        showAlert('تم مسح جميع البيانات', 'success');
    }
}

async function exportData() {
    if (state.schools.length === 0) {
        showAlert('لا توجد بيانات لترحيلها', 'warning');
        return;
    }
    
    if (!state.scriptUrl) {
        showAlert('يرجى إعداد رابط الترحيل أولاً', 'error');
        return;
    }
    
    const exportBtn = document.getElementById('exportBtn');
    const originalText = exportBtn.innerHTML;
    
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الترحيل...';
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const school of state.schools) {
            const success = await sendToGoogleSheets(school);
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
            
            // تأخير بين الطلبات
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (errorCount === 0) {
            showAlert(`تم ترحيل ${successCount} مدرسة بنجاح`, 'success');
            clearAllData(); // مسح البيانات بعد الترحيل الناجح
        } else {
            showAlert(`تم ترحيل ${successCount} مدرسة بنجاح، وفشل ترحيل ${errorCount} مدرسة`, 'warning');
        }
    } catch (error) {
        console.error('Export error:', error);
        showAlert('حدث خطأ أثناء الترحيل: ' + error.message, 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalText;
    }
}

async function sendToGoogleSheets(school) {
    try {
        // تحضير البيانات للترحيل
        const exportData = {
            action: 'saveSchoolData',
            schoolCode: school.schoolCode,
            schoolName: school.schoolName,
            educationLevel: school.educationLevel,
            date: school.date,
            timestamp: school.timestamp
        };
        
        // إضافة بيانات الصفوف
        const gradeCount = school.educationLevel === 'ابتدائي' ? 6 : 3;
        for (let i = 1; i <= gradeCount; i++) {
            const grade = school.grades[`grade${i}`];
            exportData[`grade${i}Enrolled`] = grade.enrolled;
            exportData[`grade${i}Present`] = grade.present;
            exportData[`grade${i}Absent`] = grade.absent;
        }
        
        let url = state.scriptUrl;
        
        // استخدام CORS Proxy إذا تم تفعيله
        if (state.useCorsProxy) {
            url = `https://cors-anywhere.herokuapp.com/${url}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الاستجابة: ${response.status}`);
        }
        
        const result = await response.json();
        return result.result === 'success';
    } catch (error) {
        console.error('Error sending to sheets:', error);
        return false;
    }
}

async function testConnection() {
    if (!state.scriptUrl) {
        showAlert('يرجى إعداد رابط الترحيل أولاً', 'error');
        return;
    }
    
    const testBtn = document.getElementById('testConnection');
    const statusElement = document.getElementById('connectionStatus');
    const originalText = testBtn.innerHTML;
    
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاختبار...';
    
    try {
        let url = state.scriptUrl;
        
        if (state.useCorsProxy) {
            url = `https://cors-anywhere.herokuapp.com/${url}`;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'test' })
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.result === 'success') {
            statusElement.textContent = '✓ الاتصال ناجح';
            statusElement.className = 'status-message status-success';
            showAlert('الاتصال بجوجل شيت ناجح', 'success');
        } else {
            throw new Error(result.message || 'فشل الاتصال');
        }
    } catch (error) {
        statusElement.textContent = '✗ فشل الاتصال: ' + error.message;
        statusElement.className = 'status-message status-error';
        showAlert('فشل في الاتصال: ' + error.message, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
    }
}

// وظائف التخزين المحلي
function saveData() {
    const data = {
        schools: state.schools,
        currentSchoolId: state.currentSchoolId
    };
    localStorage.setItem('schoolAttendanceData', JSON.stringify(data));
}

function loadSavedData() {
    const saved = localStorage.getItem('schoolAttendanceData');
    if (saved) {
        const data = JSON.parse(saved);
        state.schools = data.schools || [];
        state.currentSchoolId = data.currentSchoolId || 1;
    }
}

function saveSettings() {
    const settings = {
        scriptUrl: state.scriptUrl,
        useCorsProxy: state.useCorsProxy
    };
    localStorage.setItem('schoolAttendanceSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('schoolAttendanceSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.scriptUrl = settings.scriptUrl || state.scriptUrl;
        state.useCorsProxy = settings.useCorsProxy || false;
        
        // تحديث واجهة المستخدم مع الإعدادات
        document.getElementById('scriptUrl').value = state.scriptUrl;
        document.getElementById('useCorsProxy').checked = state.useCorsProxy;
    }
}

// وظيفة عرض التنبيهات
function showAlert(message, type) {
    const alertElement = document.getElementById('alert');
    alertElement.textContent = message;
    alertElement.className = `alert ${type}`;
    alertElement.classList.remove('hidden');
    
    setTimeout(() => {
        alertElement.classList.add('hidden');
    }, 5000);
}

// جعل الدوال متاحة globally للاستخدام في onClick
window.deleteSchool = deleteSchool;