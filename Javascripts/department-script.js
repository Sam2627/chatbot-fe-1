import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('table tbody');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const manageQuestionsLink = document.querySelector('.sidebar a');
 

    let allQuestionsData = [];
    let allCategories = [];
  
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
        // populateDepartmentDropdown(allCategories);
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
        const response = await fetch(`${config.apiUrl}/api/cauhoi/department`);
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
  
    const displayQuestions = (questions) => {
      tableBody.innerHTML = '';

      questions.forEach(item => {
          const row = document.createElement('tr');
          const department = allCategories.find(cat => cat.MaDonVi === item.MaDonVi);
          const tenDonVi = department ? department.TenDonVi : 'N/A';

          row.innerHTML = `
              <td>${item.CauHoiId}</td>
              <td>${item.CauHoi}</td>
              <td>${tenDonVi}</td>
              <td>${item.Email}</td>
              <td class="hidden-column">${item.MaVanBan || ''}</td> 
              <td>
                  <button class="blue addButton" data-id="${item.CauHoiId}">Trả lời</button> 
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

  const handleAddQuestion = (event) => {
      const button = event.target;
      const row = button.closest('tr');

      button.disabled = true;
      currentEditingRow = row;

      const questionId = row.querySelector('td:first-child').textContent;
      const maVanBan = row.querySelector('td:nth-child(5)').textContent; 
      const selectedDepartment = row.querySelector('td:nth-child(3)').textContent; 

      const editForm = `
          <td colspan="6">
              <form id="editForm-${questionId}">
                  <div style="margin-bottom: 10px;">
                      <label for="CauTraLoiInput">Câu trả lời:</label><br>
                      <textarea id="CauTraLoiInput" name="CauTraLoi" rows="4" cols="50" required></textarea>
                  </div>

                  <div style="margin-bottom: 10px;">
                      <label for="MaVanBanInput">Mã Văn Bản:</label><br>
                      <input type="text" id="MaVanBanInput" name="MaVanBan" value="${maVanBan}" readonly>
                  </div>

                  <div style="margin-bottom: 10px;">
                      <label for="MaDonViInput">Mã Đơn Vị:</label><br>
                      <input type="text" id="MaDonViInput" name="MaDonVi" value="${selectedDepartment}" readonly>
                  </div>

                  <div>
                      <button type="submit" class="green" style="margin-right: 10px;">Lưu</button>
                      <button type="button" class="red cancelEditButton">Hủy</button>
                  </div>
              </form>
          </td>
      `;

      row.innerHTML = editForm;

    const form = document.getElementById(`editForm-${questionId}`);
    form.addEventListener('submit', handleEditFormSubmit);
    form.querySelector('.cancelEditButton').addEventListener('click', handleEditCancel);
}; 

 const handleEditFormSubmit = async (event) => {
  event.preventDefault();

  const form = event.target;
  const questionId = form.id.split('-')[1];
  const CauTraLoi = form.CauTraLoi.value;
  const MaVanBan = form.MaVanBan.value;
  const MaDonVi = form.MaDonVi.value;

  if (categorizedTab.classList.contains('active')) {
    await handleAnsweredEditFormSubmit(event, questionId, CauTraLoi, MaVanBan, MaDonVi);
  } else
    try {
        const ThoiGianTraLoi = new Date(); 
        const department = allCategories.find(cat => cat.TenDonVi === MaDonVi);
        const MaDonViId = department ? department.MaDonVi : null; 
        
        const response = await fetch(`${config.apiUrl}/api/vanbantraloi`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                MaVanBan,
                CauTraLoi,
                MaDonVi: MaDonViId,
                ThoiGianTraLoi
            })
        });
      if (response.ok) {
        console.log("Answer added successfully!");
        await updateCauHoiWithMaVanBan(questionId, MaVanBan);
        loadCauHoi();

       // Call the /cauhoiML API to trigger training
       try {
        const trainResponse = await fetch(`${config.apiUrl}/api/cauhoiML`, { 
          method: 'POST'
        });

        if (trainResponse.ok) { 
        alert("Cập nhật câu trả lời thành công!");
        } else {
          console.error("Error triggering model training:", trainResponse.status);
        }

      } catch (trainError) {
        console.error("Error triggering model training:", trainError);
      }

      } else {
        const errorData = await response.json(); 
        console.error('Error adding answer:', response.status, errorData);
        alert(`Error adding answer: ${errorData.errors ? errorData.errors.map(err => err.msg).join(', ') : 'Please try again.'}`);
      }
      
    } catch (err) {
      console.error('Error adding answer:', err);
      alert("An error occurred. Please try again.");
    } finally {
      currentEditingRow = null; 
      const addButton = tableBody.querySelector(`.addButton[data-id="${questionId}"]`);
      if (addButton) {
        addButton.disabled = false;
      }
    }
  };

  const updateCauHoiWithMaVanBan = async (questionId) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/bophan/${questionId}`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          KhongTraLoi: 0  
        })
      });
  
      if (response.ok) {
        console.log("CauHoi updated with MaVanBan successfully!");
      } else {
        console.error('Error updating CauHoi:', response.status);
      }
    } catch (err) {
      console.error('Error updating CauHoi:', err);
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

  const displayAnsweredQuestions = (questions) => {
    tableBody.innerHTML = '';
  
    questions.forEach(item => {
      const row = document.createElement('tr');
      const departmentName = allCategories.find(c => c.MaDonVi === item.MaDonVi)?.TenDonVi || '';
  
      row.innerHTML = `
        <td>${item.MaCauHoi}</td> 
        <td>${item.CauHoi}</td>
        <td>${departmentName}</td> 
        <td>${item.Email}</td> 
        <td class="hidden-column">${item.MaVanBan || ''}</td> 
        <td>
          <button class="green editButton" data-id="${item.CauHoiId}">Chỉnh sửa</button>  
        </td>
      `;
      tableBody.appendChild(row);
    });
  
    attachEditButtonListeners(); 
  };
  
  const attachEditButtonListeners = () => {
    tableBody.addEventListener('click', (event) => {
      if (event.target.classList.contains('editButton')) {
        handleEditQuestion(event); 
      }
    });
  };
   
  const handleEditQuestion = async (event) => {
    const button = event.target;
    const row = button.closest('tr');
  
    button.disabled = true;
    currentEditingRow = row;
  
    const questionId = row.querySelector('td:first-child').textContent;
    const maVanBan = row.querySelector('.hidden-column').textContent.trim();
    const selectedDepartment = row.querySelector('td:nth-child(3)').textContent;
   
    try {
      const response = await fetch(`${config.apiUrl}/api/vanbantraloi/department/${maVanBan}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      const cauTraLoi = data.CauTraLoi; 
  
      const editForm = `
        <td colspan="6">
          <form id="editForm-${questionId}">
            <div style="margin-bottom: 10px;">
              <label for="CauTraLoiInput">Câu trả lời cũ:</label><br>
              <textarea id="CauTraLoiInput" name="CauTraLoi" rows="4" cols="50" readonly>${cauTraLoi}</textarea>
            </div>
             <div style="margin-bottom: 10px;">
              <label for="CauTraLoiInput">Câu trả lời mới:</label><br>
              <textarea id="NewCauTraLoiInput" name="CauTraLoi" rows="4" cols="50" required></textarea>
            </div>
            <div style="margin-bottom: 10px;">
                <label for="MaVanBanInput">Mã Văn Bản:</label><br>
                <input type="text" id="MaVanBanInput" name="MaVanBan" value="${maVanBan}" readonly>
            </div>
            <div style="margin-bottom: 10px;">
                <label for="MaDonViInput">Mã Đơn Vị:</label><br>
                <input type="text" id="MaDonViInput" name="MaDonVi" value="${selectedDepartment}" readonly>
            </div>
            <div>
              <button type="submit" class="green" style="margin-right: 10px;">Lưu</button>
              <button type="button" class="red cancelEditButton">Hủy</button>
            </div>
          </form>
        </td>
      `;
  
      row.innerHTML = editForm;
  
      const form = document.getElementById(`editForm-${questionId}`);
      form.addEventListener('submit', handleEditFormSubmit);
      form.querySelector('.cancelEditButton').addEventListener('click', handleEditCancel);

    } catch (err) {
      console.error('Error fetching CauTraLoi:', err);
      alert("An error occurred. Please try again.");
      button.disabled = false; 
      currentEditingRow = null;
    }
  };
  
  const handleAnsweredEditFormSubmit = async (questionId) => {
    try {
      event.preventDefault();
      const form = event.target;
      // Correct selectors to get values from the form
      const newCauTraLoi = form.NewCauTraLoiInput.value; 
      const maVanBan = form.MaVanBanInput.value;
      const ThoiGianTraLoi = new Date(); 
  
      const response = await fetch(`${config.apiUrl}/api/vanbantraloi/department/${maVanBan}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          CauTraLoi: newCauTraLoi,
          ThoiGianTraLoi,
        })
      });

      if (response.ok) {
        console.log("VanBanTraLoi updated successfully!");
        const response = await fetch(`${config.apiUrl}/api/cauhoi/departmentNO`); 
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        const answeredQuestions = await response.json();
        displayAnsweredQuestions(answeredQuestions);       } else {
        const errorData = await response.json();
        console.error('Error updating VanBanTraLoi:', response.status, errorData);
        alert(`Error updating VanBanTraLoi: ${errorData.error || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Error updating VanBanTraLoi:', err);
      alert("An error occurred. Please try again.");
    } finally {
      currentEditingRow = null;
      const editButton = tableBody.querySelector(`.editButton[data-id="${questionId}"]`);
      if (editButton) {
        editButton.disabled = false;
      }
    }
  };

   uncategorizedTab.addEventListener('click', () => {
    uncategorizedTab.classList.add('active');
    categorizedTab.classList.remove('active');
    displayQuestions(allQuestionsData); 
  });

  categorizedTab.addEventListener('click', async () => {
    uncategorizedTab.classList.remove('active');
    categorizedTab.classList.add('active');
    try {
      const response = await fetch(`${config.apiUrl}/api/cauhoi/departmentNO`); 
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const answeredQuestions = await response.json();
      console.log("API Response:", answeredQuestions);
      displayAnsweredQuestions(answeredQuestions); 
    } catch (err) {
      console.error('Error fetching answered questions:', err);
      tableBody.innerHTML = `<tr><td colspan="4">Error loading data. Please try again later.</td></tr>`;
    }
  });

  const handleEditCancel = async () => {
    if (categorizedTab.classList.contains('active')) {
      try {
        const response = await fetch(`${config.apiUrl}/api/cauhoi/departmentNO`); 
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        const answeredQuestions = await response.json();
        displayAnsweredQuestions(answeredQuestions); 
      } catch (err) {
        console.error('Error fetching answered questions:', err);
        tableBody.innerHTML = `<tr><td colspan="4">Error loading data. Please try again later.</td></tr>`;
      }
    } else {
      loadCauHoi(); 
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
   
  manageQuestionsLink.addEventListener('click', (event) => {
    event.preventDefault();
    searchInput.value = '';
    tableBody.innerHTML = '';
    loadCauHoi(); 
    // Set "Chưa chuyển" tab as active
    uncategorizedTab.classList.add('active');
    categorizedTab.classList.remove('active');
  });

      Promise.all([loadCategories(), loadTopics()])
        .then(() => loadCauHoi())
        .catch(err => {
          console.error('Error loading initial data:', err);
          tableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please try again later.</td></tr>`;
        });
    });