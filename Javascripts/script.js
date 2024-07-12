import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const askUsButton = document.getElementById('askUsButton');
  const chatBox = document.getElementById('chatBox');
  const closeChatBoxButton = document.getElementById('closeChatBox');
  const chatInput = document.getElementById('userInput');
  const sendMessageButton = document.getElementById('sendButton');
  const chatBody = document.getElementById('chatbox');
  const similarQuestionsContainer = document.getElementById('similarQuestions');
  const similarQuestionsList = document.getElementById('similarQuestionsList');
  const clearSimilarQuestionsButton = document.getElementById('clearSimilarQuestionsButton');
  const loginButton = document.getElementById('loginButton');

document.getElementById('loginButton').addEventListener('click', () => {
  window.location.href = 'login.html';
});

// Function to check if the user is logged in using JWT token
function checkLoginStatus() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      // No JWT token found, user is not logged in
      loginButton.textContent = 'Đăng Nhập';
      loginButton.onclick = () => window.location.href = 'login.html';
      return;
    }
    // Verify the JWT token on the server side
    fetch(`${config.apiUrl}/api/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: authToken }),
      credentials: 'include' 
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Token verification failed');
      }
    })
    .then(() => {
      // Token is valid, update UI accordingly
      loginButton.textContent = 'Đăng Xuất';
      loginButton.onclick = handleLogout;
    })
    .catch(error => {
      console.error('Error checking login status:', error);
      loginButton.textContent = 'Đăng Nhập';
      loginButton.onclick = () => window.location.href = 'login.html';
    });
  }
  
  // Function to handle logout
  function handleLogout() {
    localStorage.removeItem('authToken'); // Clear JWT token from localStorage
    fetch(`${config.apiUrl}/api/logout`, {
      method: 'POST',
      credentials: 'include' // Include credentials
    })
    .then(response => {
      if (response.ok) {
        window.location.href = '/login.html';
      } else {
        console.error('Error logging out:', response);
      }
    })
    .catch(error => console.error('Logout error:', error));
  }
  
  // Check login status on page load
  checkLoginStatus();
  

  askUsButton.addEventListener('click', () => {
      chatBox.classList.toggle('hidden');
  });

  closeChatBoxButton.addEventListener('click', () => {
      chatBox.classList.add('hidden');
  });

  sendMessageButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
          sendMessage();
      }
  });

  async function sendMessage() {
      const userInput = chatInput.value.trim();
      if (userInput === '') return;

      displayMessage(userInput, true);
      chatInput.value = ''; 

      try {
          const response = await fetch(`${config.apiUrl}/api/processTextML`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ text: userInput })
          });

          if (!response.ok) {
              throw new Error(`Server error: ${response.status}`);
          }

          const data = await response.json();

          const chatbotMessage = `
              <div class="chatbotMessage">
                  <p>${data.CauTraLoi}</p>
                  <div class="feedback-buttons">
                      <button class="feedback-button like">
                          <i class="fas fa-thumbs-up"></i>
                      </button>
                      <button class="feedback-button dislike">
                          <i class="fas fa-thumbs-down"></i>
                      </button>
                  </div>
              </div>
          `;
          chatBody.innerHTML += chatbotMessage;
          addFeedbackButtonListeners();

          displaySimilarQuestions(data.Suggestions, userInput);
          chatBody.scrollTop = chatBody.scrollHeight;
        } catch (error) {
            console.error('Error:', error.message);
    
            const chatbotMessage = `
                <div class="chatbotMessage">
                    <p>Câu hỏi của bạn quá ngắn hoặc chưa có câu trả lời. Vui lòng nhập lại câu hỏi hoặc bấm vào nút dislike bên dưới để gửi câu hỏi!.</p>
                    <div class="feedback-buttons">
                        <button class="feedback-button like">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <button class="feedback-button dislike">
                            <i class="fas fa-thumbs-down"></i>
                        </button>
                    </div>
                </div>
            `;
            chatBody.innerHTML += chatbotMessage;
            addFeedbackButtonListeners();
        }
    }

  function displayMessage(message, isUser) {
      const chatbox = document.getElementById("chatbox");
      const messageDiv = document.createElement("div");
      messageDiv.className = isUser ? "userMessage" : "chatbotMessage";
      messageDiv.textContent = message;
      chatbox.appendChild(messageDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
  }

  function displaySimilarQuestions(suggestions, userQuestion) {
      similarQuestionsContainer.classList.remove('hidden');
      similarQuestionsList.innerHTML = '';
      suggestions.forEach(question => {
          const listItem = document.createElement('li');
          listItem.textContent = question;
          listItem.addEventListener('click', () => {
              chatInput.value = question;
              sendMessage();
              setTimeout(() => {
                  chatBody.scrollTop = chatBody.scrollHeight;
              }, 100); 
          });
          similarQuestionsList.appendChild(listItem);
      });

      if (suggestions.length > 0) {
          clearSimilarQuestionsButton.classList.remove('hidden');
      } else {
          clearSimilarQuestionsButton.classList.add('hidden');
      }
  }

  function addFeedbackButtonListeners() {
      const likeButtons = document.querySelectorAll('.chatbotMessage .like');
      const dislikeButtons = document.querySelectorAll('.chatbotMessage .dislike');

      likeButtons.forEach(button => {
          button.addEventListener('click', handleFeedbackButtonClick);
      });

      dislikeButtons.forEach(button => {
          button.addEventListener('click', handleFeedbackButtonClick);
      });
  }

  function handleFeedbackButtonClick(event) {
    const button = event.target.closest('.feedback-button');
    const messageContainer = button.closest('.chatbotMessage');
    const userQuestion = messageContainer.previousElementSibling.textContent;
  
    button.classList.toggle('active');
  
    const otherButton = button.classList.contains('like')
        ? messageContainer.querySelector('.dislike')
        : messageContainer.querySelector('.like');
    otherButton.classList.remove('active');
  
    console.log('Feedback sent:', button.classList.contains('like') ? 'like' : 'dislike');
  
  if (button.classList.contains('like')) {
    try {
      const response =  fetch(`${config.apiUrl}/api/cauhoiMLup`, { 
        method: 'POST'
      });
      if (response.ok) {
        console.log("Question added to CauHoiML successfully!");
      } else {
        console.error('Error adding question to CauHoiML:', response.status);
      }
    } catch (err) {
      console.error('Error adding question to CauHoiML:', err);
    } 
    
    similarQuestionsContainer.classList.add('hidden');

  } else if (button.classList.contains('dislike')) { 
      const feedbackFormHTML = `
          <div class="feedback-form">
            <label for="userEmail">Nhập Email để nhận thông báo câu trả lời:</label><br>
            <input type="email" id="userEmail" name="userEmail">  <br><br>
            <button id="submitFeedbackButton">Gửi</button>
          </div>
      `;
  
      messageContainer.insertAdjacentHTML('beforeend', feedbackFormHTML);
  
      const submitFeedbackButton = messageContainer.querySelector('#submitFeedbackButton');
      submitFeedbackButton.addEventListener('click', async () => {
          const userEmail = messageContainer.querySelector('#userEmail').value;
  
          try {
            const response = await fetch(`${config.apiUrl}/api/cauhoi`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                MaCauHoi: null,  
                CauHoi: userQuestion, 
                MaDonVi: null, 
                MaChuDe: null, 
                MaVanBan: null, 
                Email: userEmail,
                ThoiGianHoi: null,
                CoThayDoi: null, 
                KhongTraLoi: null 
              })
            });
  
            if (response.ok) {
              const data = await response.json(); 
              console.log("Question added successfully:", data);
  
              const chatbotAcknowledgement = `
                  <div class="chatbotMessage">
                      <p>${data.message}</p>
                  </div>
              `;
              chatBody.innerHTML += chatbotAcknowledgement;
              chatBody.scrollTop = chatBody.scrollHeight;
  
              messageContainer.querySelector('.feedback-form').remove(); 
            } else {
              console.error('Error adding question:', response.status);
              alert("Error adding question. Please try again.");
            }
          } catch (err) {
            console.error('Error adding question:', err);
            alert("An error occurred. Please try again.");
          }
      });
    }
  } 

  document.getElementById('clearButton').addEventListener('click', () => {
      chatBody.innerHTML = '';
      similarQuestionsContainer.classList.add('hidden');
      clearSimilarQuestionsButton.classList.add('hidden');
  });

  clearSimilarQuestionsButton.addEventListener('click', () => {
      similarQuestionsList.innerHTML = '';
      similarQuestionsContainer.classList.add('hidden');
      clearSimilarQuestionsButton.classList.add('hidden');
  });

//   function containsKeywords(question, keywords) {
//       return keywords.some(keyword => question.toLowerCase().includes(keyword.toLowerCase()));
//   }
});