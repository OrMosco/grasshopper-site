// ========================================
// Attendance Page Logic
// הבעה במחשב - אוניברסיטת חיפה
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const groupSelect = document.getElementById('group-select');
  const nameSelect = document.getElementById('name-select');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('status-message');

  // Display current lesson info
  const lessonDisplay = document.getElementById('current-lesson-display');
  if (lessonDisplay) {
    lessonDisplay.textContent = `שיעור ${CURRENT_LESSON}`;
  }

  // Populate names when group is selected
  groupSelect.addEventListener('change', () => {
    const group = parseInt(groupSelect.value);
    nameSelect.innerHTML = '<option value="">-- בחר/י את שמך --</option>';

    if (group) {
      const names = getStudentNames(group);
      names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameSelect.appendChild(option);
      });
      nameSelect.disabled = false;
    } else {
      nameSelect.disabled = true;
    }
  });

  // Submit attendance
  submitBtn.addEventListener('click', () => {
    const group = groupSelect.value;
    const name = nameSelect.value;

    if (!group || !name) {
      showStatus('אנא בחר/י קבוצה ושם', 'error');
      return;
    }

    // Check if already submitted today using localStorage
    const todayKey = `attendance_${CURRENT_LESSON}_${group}_${name}`;
    if (localStorage.getItem(todayKey)) {
      showStatus('כבר נרשמת לשיעור זה! ✓', 'warning');
      return;
    }

    // Mark attendance in localStorage
    localStorage.setItem(todayKey, new Date().toISOString());

    // Track all attendances for this student
    const historyKey = `attendance_history_${group}_${name}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    if (!history.includes(CURRENT_LESSON)) {
      history.push(CURRENT_LESSON);
      localStorage.setItem(historyKey, JSON.stringify(history));
    }

    showStatus(`✓ ${name}, נרשמת בהצלחה לשיעור ${CURRENT_LESSON}!`, 'success');
    submitBtn.disabled = true;

    // Show confetti-like effect
    createSuccessAnimation();
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
  }

  function createSuccessAnimation() {
    const card = document.querySelector('.attendance-card');
    card.style.borderColor = 'var(--success)';
    card.style.boxShadow = '0 0 30px rgba(0, 212, 170, 0.3)';

    setTimeout(() => {
      card.style.borderColor = 'var(--border)';
      card.style.boxShadow = 'none';
    }, 2000);
  }
});
