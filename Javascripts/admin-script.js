import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('table tbody');
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const clearSearchButton = document.getElementById('clearSearchButton');
  const manageQuestionsLink = document.getElementById('manageQuestionsLink');
  const uncategorizedTab = document.getElementById('uncategorizedTab');
  const categorizedTab = document.getElementById('categorizedTab');
  const updateButton = document.getElementById('updateButton');
  const logoutButton = document.getElementById('logoutButton');

  let allQuestionsData = []; 
  let allCategories = []; 
  let allTopics = []; 

  // Function to verify JWT token
  const verifyToken = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await  fetch(`${config.apiUrl}/api/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: token }),
          credentials: 'include' 
        });

        if (!response.ok) {
          throw new Error(`Token verification failed: ${response.status}`);
        }
        const data = await response.json();
        console.log(data.message); // Token is valid
      } catch (error) {
        console.error("Token verification error:", error);
        localStorage.removeItem('authToken');
        window.location.href = '/login.html'; // Redirect to login if token is invalid
      }
    } else {
      console.log("No token found. Redirecting to login.");
      window.location.href = '/login.html';
    }
  };

  // Call verifyToken on page load
  verifyToken();

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken'); 
    fetch(`${config.apiUrl}/api/logout`, {
      method: 'POST', 
      credentials: 'include' // Include credentials
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }
      return response.json(); 
    })
    .then(data => {
      console.log(data.message); 
      window.location.href = '/login.html'; 
    })
    .catch(error => {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again later."); 
    });
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/donvi`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      allCategories = await response.json();
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/chude`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      allTopics = await response.json();
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const loadCauHoi = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      allQuestionsData = data;
      displayQuestions(allQuestionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      tableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please try again later.</td></tr>`;
    }
  };

  updateButton.addEventListener('click', async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/train`, {
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      console.log(data.message); 
      alert("Cập nhật câu trả lời thành công!"); 
    } catch (error) {
      console.error('Error training model:', error);
      alert("Đã xảy ra lỗi khi cập nhật câu trả lời.");
    }
  });
  
  const displayQuestions = (questions) => {
    tableBody.innerHTML = '';

    questions.forEach(item => {
      const row = document.createElement('tr');

      const departmentOptions = allCategories.map(category =>
        `<option value="${category.MaDonVi}">${category.TenDonVi}</option>`
      ).join('');

      const topicOptions = allTopics.map(topic =>
        `<option value="${topic.MaChuDe}">${topic.TenChuDe}</option>`
      ).join('');

      row.innerHTML = `
        <td>${item.CauHoiId}</td>
        <td>${item.CauHoi}</td>
        <td>
          <select id="departmentSelect-${item.CauHoiId}"> 
            <option value="">-- Chọn bộ phận --</option>
            ${departmentOptions}
          </select>
        </td>
        <td>
          <select id="topicSelect-${item.CauHoiId}">
            <option value="">-- Chọn chủ đề --</option>
            ${topicOptions}
          </select>
        </td>
        <td>${item.Email}</td> 
        <td>
          <button class="blue addButton" data-id="${item.CauHoiId}">Thêm</button> 
          <button class="red deleteButton" data-id="${item.CauHoiId}">Xóa</button> 
        </td>
      `;
      tableBody.appendChild(row);
    });

    attachAddButtonListeners();
    attachDeleteButtonListeners();
  };

  const attachAddButtonListeners = () => {
    tableBody.addEventListener('click', (event) => {
      if (event.target.classList.contains('addButton')) {
        handleAddQuestion(event);
      }
    });
  };

  const handleAddQuestion = async (event) => {
    const button = event.target;
    const row = button.closest('tr');

    const questionId = row.querySelector('td:first-child').textContent;
    const questionText = row.querySelector('td:nth-child(2)').textContent;
    const selectedDepartment = row.querySelector(`#departmentSelect-${questionId}`).value;
    const selectedTopic = row.querySelector(`#topicSelect-${questionId}`).value;
    const email = row.querySelector('td:nth-child(5)').textContent;

    if (!selectedDepartment || !selectedTopic) {
      alert("Vui lòng chọn Chủ Đề, Bộ Phận");
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/${questionId}`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          CauHoi: questionText, 
          MaDonVi: selectedDepartment, 
          MaChuDe: selectedTopic, 
          Email: email,         
          ThoiGianHoi: new Date(),
          CoThayDoi: 0, 
          KhongTraLoi: 1,
          CoTraLoi:1
        })
      });

      if (response.ok) {
        console.log("Question added successfully!");
        loadCauHoi(); 
      } else {
        const errorData = await response.json();
        console.error('Error adding question:', response.status, errorData);
        alert(`Error adding question: ${errorData.errors ? errorData.errors.map(err => err.msg).join(', ') : 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Error adding question:', err);
      alert("An error occurred. Please try again.");
    }
  };

  const attachDeleteButtonListeners = () => {
    tableBody.addEventListener('click', (event) => {
      if (event.target.classList.contains('deleteButton')) {
        handleDeleteQuestion(event);
      }
    });
  };

  const handleDeleteQuestion = async (event) => {
    const button = event.target;
    const questionId = button.dataset.id;

    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/${questionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log("Question deleted successfully!");
        button.closest('tr').remove();
      } else {
        console.error('Error deleting question:', response.status);
        alert("Error deleting question. Please try again.");
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      alert("An error occurred. Please try again.");
    }
  };

 const searchQuestions = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredQuestions = allQuestionsData.filter(question => {
      return question.CauHoi.toLowerCase().includes(searchTerm); 
    });
    displayQuestions(filteredQuestions);
  };
  searchButton.addEventListener('click', searchQuestions);

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === "Enter" || event.keyCode === 13) {
      searchQuestions(); 
    }
  });

  clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    displayQuestions(allQuestionsData);
  });

  const displayCategorizedQuestions = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/departmentYES`); // Your API endpoint
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const questions = await response.json();
  
      tableBody.innerHTML = '';
  
      questions.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.CauHoiId}</td>
          <td>${item.CauHoi}</td>
          <td>${item.MaDonVi ? allCategories.find(c => c.MaDonVi === item.MaDonVi).TenDonVi : ''}</td> 
          <td>${item.MaChuDe ? allTopics.find(t => t.MaChuDe === item.MaChuDe).TenChuDe : ''}</td>
          <td>${item.Email}</td> 
          <td>
            <button class="red recallButton" data-id="${item.CauHoiId}">Thu Hồi</button> 
          </td>
        `;
        tableBody.appendChild(row);
      });
  
      attachRecallButtonListeners();
  
    } catch (err) {
      console.error('Error fetching categorized questions:', err);
      tableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please try again later.</td></tr>`;
    }
  };

  const attachRecallButtonListeners = () => {
    tableBody.addEventListener('click', (event) => {
      if (event.target.classList.contains('recallButton')) {
        handleRecallQuestion(event);
      }
    });
  };
  
  const handleRecallQuestion = async (event) => {
    const button = event.target;
    const questionId = button.dataset.id;
  
    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/thuhoi/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          MaDonVi: null, 
          MaChuDe: null,
          CoTraLoi: 0,
          KhongTraLoi: 0,
        })
      });
  
      if (response.ok) {
        console.log("Question recalled successfully!");

        // Refresh the table based on the currently active tab
        if (categorizedTab.classList.contains('active')) {
          displayCategorizedQuestions(); 
        } else {
          loadCauHoi();
        }
      } else {
        console.error('Error recalling question:', response.status);
        alert("Error recalling question. Please try again.");
      }
    } catch (err) {
      console.error('Error recalling question:', err);
      alert("An error occurred. Please try again.");
    }
  };

  manageQuestionsLink.addEventListener('click', (event) => {
    event.preventDefault();
    searchInput.value = '';
    tableBody.innerHTML = '';
    loadCauHoi(); 
    // Set "Chưa chuyển" tab as active
    uncategorizedTab.classList.add('active');
    categorizedTab.classList.remove('active');
  });

  uncategorizedTab.addEventListener('click', () => {
    loadCauHoi();
    uncategorizedTab.classList.add('active');
    categorizedTab.classList.remove('active');
    displayQuestions(allQuestionsData); 
  });

  categorizedTab.addEventListener('click', () => {
    uncategorizedTab.classList.remove('active');
    categorizedTab.classList.add('active');
    const categorizedQuestions = allQuestionsData.filter(question => question.MaDonVi && question.MaChuDe);
    displayCategorizedQuestions(categorizedQuestions);
  });

  Promise.all([loadCategories(), loadTopics()]) 
  .then(() => loadCauHoi())


});